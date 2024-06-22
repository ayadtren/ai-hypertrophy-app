// src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { getAuth, signOut, User } from 'firebase/auth';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import ExerciseLog from './ExerciseLog';
import TrainingCycleSummary from './TrainingCycleSummary';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://yourwebsite.com/">
        Your Hypertrophy App
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const theme = createTheme();

interface WorkoutLog {
  id?: string;
  userId: string;
  exercise: string;
  weight: number;
  reps: number;
  tut: number;
  date: Date;
}
const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (user) {
        const q = query(
          collection(db, 'workoutLogs'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as WorkoutLog));
        setWorkoutLogs(logs);
      }
    };

    fetchWorkoutLogs();
  }, [user]);

  const handleLogExercise = async (exercise: string, weight: number, reps: number, tut: number) => {
    if (user) {
      const newLog = {
        userId: user.uid,
        exercise,
        weight,
        reps,
        tut,
        date: new Date()
      };
      await addDoc(collection(db, 'workoutLogs'), newLog);
      setWorkoutLogs(prevLogs => [newLog as WorkoutLog, ...prevLogs]);
    }
  };

  const calculateNextWorkoutGoal = (log: WorkoutLog) => {
    const weekInCycle = currentWeek % 4;
    let newWeight = log.weight;
    let newReps = log.reps;
    let newTut = log.tut;

    switch (weekInCycle) {
      case 1: // Strength focus
        newWeight = Math.round(log.weight * 1.05); // 5% increase
        newReps = Math.max(1, log.reps - 2); // Decrease reps, minimum 1
        break;
      case 2: // Hypertrophy focus
        newWeight = Math.round(log.weight * 1.025); // 2.5% increase
        newReps = log.reps + 2; // Increase reps
        break;
      case 3: // Endurance focus
        newWeight = Math.round(log.weight * 0.9); // 10% decrease
        newReps = log.reps + 4; // Increase reps significantly
        newTut = log.tut + 10; // Increase time under tension
        break;
      case 0: // Deload week
        newWeight = Math.round(log.weight * 0.7); // 30% decrease
        newReps = Math.round(log.reps * 0.7); // 30% decrease in reps
        newTut = Math.round(log.tut * 0.7); // 30% decrease in time under tension
        break;
    }

    return `Next goal: ${newWeight} lbs x ${newReps} reps, ${newTut} seconds under tension`;
  };

  const handleNextWeek = () => {
    setCurrentWeek((prevWeek) => (prevWeek % 4) + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* Welcome message */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h4" gutterBottom>
                    Welcome, {user?.displayName || user?.email}
                  </Typography>
                  <Typography variant="h6">
                    Current Week: {currentWeek} ({['Deload', 'Strength', 'Hypertrophy', 'Endurance'][currentWeek % 4]})
                  </Typography>
                  <Button onClick={handleNextWeek} variant="contained" sx={{ mt: 2, alignSelf: 'flex-start' }}>
                    Next Week
                  </Button>
                </Paper>
              </Grid>
              {/* Training Cycle Summary */}
              <Grid item xs={12} md={6}>
                <TrainingCycleSummary currentWeek={currentWeek} />
              </Grid>
              {/* Exercise Log */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <ExerciseLog onLogExercise={handleLogExercise} />
                </Paper>
              </Grid>
              {/* Workout History */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" gutterBottom>
                    Recent Workouts and Next Goals
                  </Typography>
                  {workoutLogs.length > 0 ? (
                    <ul>
                      {workoutLogs.map((log) => (
                        <li key={log.id}>
                          <Typography>
                            {log.exercise}: {log.weight} lbs x {log.reps} reps, {log.tut} seconds under tension
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(log.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {calculateNextWorkoutGoal(log)}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography>No workout data available.</Typography>)}
                </Paper>
              </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;