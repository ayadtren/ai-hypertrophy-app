import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firebase'; // Adjust this import path as necessary
import styled from 'styled-components';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  exercises: Exercise[];
}

const WorkoutPlanComponent: React.FC = () => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = getFirestore(app);
  const auth = getAuth(app);

  useEffect(() => {
    fetchWorkoutPlans();
    fetchAvailableExercises();
  }, []);

  const fetchWorkoutPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const q = query(collection(db, 'workoutPlans'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const plans: WorkoutPlan[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WorkoutPlan));
      setWorkoutPlans(plans);
    } catch (err) {
      setError('Failed to fetch workout plans. Please try again.');
      console.error('Error fetching workout plans:', err);
    }
    setLoading(false);
  };

  const fetchAvailableExercises = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exercises: Exercise[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        sets: 3,
        reps: 10
      }));
      setAvailableExercises(exercises);
    } catch (err) {
      console.error('Error fetching available exercises:', err);
    }
  };

  const createWorkoutPlan = async () => {
    if (!newPlanName.trim()) {
      setError('Please enter a plan name');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const newPlan = {
        name: newPlanName,
        exercises: [],
        userId: user.uid
      };
      const docRef = await addDoc(collection(db, 'workoutPlans'), newPlan);
      setWorkoutPlans([...workoutPlans, { ...newPlan, id: docRef.id }]);
      setNewPlanName('');
    } catch (err) {
      setError('Failed to create workout plan. Please try again.');
      console.error('Error creating workout plan:', err);
    }
  };

  const selectPlan = (plan: WorkoutPlan) => {
    setCurrentPlan(plan);
  };

  const addExerciseToPlan = async () => {
    if (!currentPlan || !selectedExercise) return;
    try {
      const exerciseToAdd = availableExercises.find(ex => ex.id === selectedExercise);
      if (!exerciseToAdd) return;

      const updatedExercises = [...currentPlan.exercises, { ...exerciseToAdd, sets, reps }];
      const planRef = doc(db, 'workoutPlans', currentPlan.id);
      await updateDoc(planRef, { exercises: updatedExercises });

      setCurrentPlan({ ...currentPlan, exercises: updatedExercises });
      setWorkoutPlans(workoutPlans.map(plan => 
        plan.id === currentPlan.id ? { ...plan, exercises: updatedExercises } : plan
      ));

      setSelectedExercise('');
      setSets(3);
      setReps(10);
    } catch (err) {
      setError('Failed to add exercise to plan. Please try again.');
      console.error('Error adding exercise to plan:', err);
    }
  };

  const removeExerciseFromPlan = async (exerciseId: string) => {
    if (!currentPlan) return;
    try {
      const updatedExercises = currentPlan.exercises.filter(ex => ex.id !== exerciseId);
      const planRef = doc(db, 'workoutPlans', currentPlan.id);
      await updateDoc(planRef, { exercises: updatedExercises });

      setCurrentPlan({ ...currentPlan, exercises: updatedExercises });
      setWorkoutPlans(workoutPlans.map(plan => 
        plan.id === currentPlan.id ? { ...plan, exercises: updatedExercises } : plan
      ));
    } catch (err) {
      setError('Failed to remove exercise from plan. Please try again.');
      console.error('Error removing exercise from plan:', err);
    }
  };

  const deleteWorkoutPlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this workout plan?')) {
      try {
        await deleteDoc(doc(db, 'workoutPlans', planId));
        setWorkoutPlans(workoutPlans.filter(plan => plan.id !== planId));
        if (currentPlan?.id === planId) {
          setCurrentPlan(null);
        }
      } catch (err) {
        setError('Failed to delete workout plan. Please try again.');
        console.error('Error deleting workout plan:', err);
      }
    }
  };

  if (loading) return <LoadingMessage>Loading workout plans...</LoadingMessage>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <h1>Workout Plans</h1>
      <PlanCreationForm>
        <Input
          type="text"
          value={newPlanName}
          onChange={(e) => setNewPlanName(e.target.value)}
          placeholder="New Plan Name"
        />
        <Button onClick={createWorkoutPlan}>Create New Plan</Button>
      </PlanCreationForm>

      <PlanList>
        {workoutPlans.map((plan) => (
          <PlanItem key={plan.id}>
            <PlanName onClick={() => selectPlan(plan)}>{plan.name}</PlanName>
            <DeleteButton onClick={() => deleteWorkoutPlan(plan.id)}>Delete</DeleteButton>
          </PlanItem>
        ))}
      </PlanList>

      {currentPlan && (
        <PlanDetails>
          <h2>{currentPlan.name}</h2>
          <ExerciseForm>
            <Select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              <option value="">Select an exercise</option>
              {availableExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              value={sets}
              onChange={(e) => setSets(parseInt(e.target.value))}
              placeholder="Sets"
              min="1"
            />
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value))}
              placeholder="Reps"
              min="1"
            />
            <Button onClick={addExerciseToPlan}>Add Exercise</Button>
          </ExerciseForm>

          <ExerciseList>
            {currentPlan.exercises.map((exercise) => (
              <ExerciseItem key={exercise.id}>
                <ExerciseName>{exercise.name}</ExerciseName>
                <ExerciseDetails>
                  {exercise.sets} sets x {exercise.reps} reps
                </ExerciseDetails>
                <RemoveButton onClick={() => removeExerciseFromPlan(exercise.id)}>
                  Remove
                </RemoveButton>
              </ExerciseItem>
            ))}
          </ExerciseList>
        </PlanDetails>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const PlanCreationForm = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const PlanList = styled.div`
  margin-bottom: 20px;
`;

const PlanItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const PlanName = styled.span`
  font-size: 18px;
  cursor: pointer;
`;

const DeleteButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #c82333;
  }
`;

const PlanDetails = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 20px;
`;

const ExerciseForm = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
`;

const ExerciseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ExerciseItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const ExerciseName = styled.span`
  font-weight: bold;
`;

const ExerciseDetails = styled.span`
  color: #6c757d;
`;

const RemoveButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #5a6268;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

export default WorkoutPlanComponent;
