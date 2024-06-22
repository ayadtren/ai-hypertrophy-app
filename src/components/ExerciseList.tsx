import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../config/firebase'; // Adjust this import path as necessary
import styled from 'styled-components'; // This line is changed

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
}

const ExerciseList: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExercise, setNewExercise] = useState({ name: '', category: '', description: '' });
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const db = getFirestore(app);

  const fetchCategories = useCallback(async () => {
    try {
      const q = query(collection(db, 'exercises'));
      const querySnapshot = await getDocs(q);
      const uniqueCategories = new Set<string>();
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          uniqueCategories.add(data.category);
        }
      });
      setCategories(Array.from(uniqueCategories));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [db]); // Include dependencies of fetchCategories

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'exercises'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const exerciseList: Exercise[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Exercise));
      setExercises(exerciseList);
    } catch (err) {
      setError('Failed to fetch exercises. Please try again.');
      console.error('Error fetching exercises:', err);
    }
    setLoading(false);
  }, [db]); // Include dependencies of fetchExercises

  useEffect(() => {
    fetchExercises();
    fetchCategories();
  }, [fetchExercises, fetchCategories]); // Include dependencies here

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingExercise) {
      setEditingExercise({ ...editingExercise, [name]: value });
    } else {
      setNewExercise({ ...newExercise, [name]: value });
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const addExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'exercises'), newExercise);
      setNewExercise({ name: '', category: '', description: '' });
      fetchExercises();
    } catch (err) {
      setError('Failed to add exercise. Please try again.');
      console.error('Error adding exercise:', err);
    }
  };

  const startEditing = (exercise: Exercise) => {
    setEditingExercise(exercise);
  };

  const cancelEditing = () => {
    setEditingExercise(null);
  };

  const saveEdit = async () => {
    if (!editingExercise) return;
    try {
      const exerciseRef = doc(db, 'exercises', editingExercise.id);
      await updateDoc(exerciseRef, {
        name: editingExercise.name,
        category: editingExercise.category,
        description: editingExercise.description
      });
      setEditingExercise(null);
      fetchExercises();
    } catch (err) {
      setError('Failed to update exercise. Please try again.');
      console.error('Error updating exercise:', err);
    }
  };

  const deleteExercise = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await deleteDoc(doc(db, 'exercises', id));
        fetchExercises();
      } catch (err) {
        setError('Failed to delete exercise. Please try again.');
        console.error('Error deleting exercise:', err);
      }
    }
  };

  const filteredExercises = selectedCategory
    ? exercises.filter((exercise) => exercise.category === selectedCategory)
    : exercises;

  if (loading) return <LoadingMessage>Loading exercises...</LoadingMessage>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <h1>Exercise List</h1>
      <Form onSubmit={addExercise}>
        <Input
          type="text"
          name="name"
          value={newExercise.name}
          onChange={handleInputChange}
          placeholder="Exercise Name"
          required
        />
        <Input
          type="text"
          name="category"
          value={newExercise.category}
          onChange={handleInputChange}
          placeholder="Category"
          required
        />
        <TextArea
          name="description"
          value={newExercise.description}
          onChange={handleInputChange}
          placeholder="Description"
          required
        />
        <Button type="submit">Add Exercise</Button>
      </Form>

      <FilterContainer>
        <Select value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </FilterContainer>

      <ExerciseGrid>
        {filteredExercises.map((exercise) => (
          <ExerciseCard key={exercise.id}>
            {editingExercise && editingExercise.id === exercise.id ? (
              <>
                <Input
                  type="text"
                  name="name"
                  value={editingExercise.name}
                  onChange={handleInputChange}
                />
                <Input
                  type="text"
                  name="category"
                  value={editingExercise.category}
                  onChange={handleInputChange}
                />
                <TextArea
                  name="description"
                  value={editingExercise.description}
                  onChange={handleInputChange}
                />
                <ButtonGroup>
                  <Button onClick={saveEdit}>Save</Button>
                  <Button onClick={cancelEditing}>Cancel</Button>
                </ButtonGroup>
              </>
            ) : (
              <>
                <h2>{exercise.name}</h2>
                <p><strong>Category:</strong> {exercise.category}</p>
                <p>{exercise.description}</p>
                <ButtonGroup>
                  <Button onClick={() => startEditing(exercise)}>Edit</Button>
                  <Button onClick={() => deleteExercise(exercise.id)}>Delete</Button>
                </ButtonGroup>
              </>
            )}
          </ExerciseCard>
        ))}
      </ExerciseGrid>

      {filteredExercises.length === 0 && (
        <LoadingMessage>No exercises found.</LoadingMessage>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const ExerciseCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

const FilterContainer = styled.div`
  margin-bottom: 20px;
`;

const Select = styled.select`
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

export default ExerciseList;
