import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import WorkoutPlan from './components/Workoutplan';
import ExerciseList from './components/ExerciseList';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workout-plan" element={<WorkoutPlan />} />
        <Route path="/exercise-list" element={<ExerciseList />} />
      </Routes>
    </Router>
  );
};

export default App;