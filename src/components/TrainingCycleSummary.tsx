import  React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';

interface TrainingCycleSummaryProps {
  currentWeek: number;
}

const TrainingCycleSummary: React.FC<TrainingCycleSummaryProps> = ({ currentWeek }) => {
  const weekDetails = [
    {
      name: 'Strength',
      focus: 'Heavy weights, lower reps',
      strategy: 'Increase weight by 5%, decrease reps'
    },
    {
      name: 'Hypertrophy',
      focus: 'Moderate weights, higher reps',
      strategy: 'Increase weight by 2.5%, increase reps'
    },
    {
      name: 'Endurance',
      focus: 'Lower weights, high reps, increased TUT',
      strategy: 'Decrease weight by 10%, increase reps and TUT'
    },
    {
      name: 'Deload',
      focus: 'Recovery and active rest',
      strategy: 'Decrease weight, reps, and TUT by 30%'
    }
  ];

  const currentPhase = weekDetails[currentWeek % 4];

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Current Training Phase: {currentPhase.name}
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText primary="Focus" secondary={currentPhase.focus} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Strategy" secondary={currentPhase.strategy} />
        </ListItem>
      </List>
    </Paper>
  );
};

export default TrainingCycleSummary;