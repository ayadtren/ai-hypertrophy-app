// ExerciseLog.tsx
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface ExerciseLogProps {
  onLogExercise: (exercise: string, weight: number, reps: number, tut: number) => void;
}

const ExerciseLog: React.FC<ExerciseLogProps> = ({ onLogExercise }) => {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [tut, setTut] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exercise && weight && reps && tut) {
      onLogExercise(exercise, parseFloat(weight), parseInt(reps, 10), parseInt(tut, 10));
      setExercise('');
      setWeight('');
      setReps('');
      setTut('');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Log Exercise
      </Typography>
      <TextField
        label="Exercise"
        value={exercise}
        onChange={(e) => setExercise(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Weight (lbs)"
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Reps"
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <FormControl fullWidth margin="normal" required>
        <InputLabel>Time Under Tension (seconds)</InputLabel>
        <Select
          value={tut}
          label="Time Under Tension (seconds)"
          onChange={(e) => setTut(e.target.value as string)}
        >
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={30}>30</MenuItem>
          <MenuItem value={40}>40</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={60}>60</MenuItem>
        </Select>
      </FormControl>
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Log Exercise
      </Button>
    </Box>
  );
};

export default ExerciseLog;