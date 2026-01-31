import type { LessonCategory } from './lessons';

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const QUIZZES: Record<LessonCategory, QuizQuestion[]> = {
  letters: [
    {
      id: 'letters-q1',
      prompt: 'Which letter says "A"?',
      options: ['A', 'B', 'C'],
      correctIndex: 0,
    },
    {
      id: 'letters-q2',
      prompt: 'Which letter comes after A?',
      options: ['B', 'C', 'D'],
      correctIndex: 0,
    },
    {
      id: 'letters-q3',
      prompt: 'Which letter is in "Cat"?',
      options: ['A', 'C', 'B'],
      correctIndex: 1,
    },
  ],
  numbers: [
    {
      id: 'numbers-q1',
      prompt: 'Which number is one?',
      options: ['1', '2', '3'],
      correctIndex: 0,
    },
    {
      id: 'numbers-q2',
      prompt: 'Which number is two?',
      options: ['1', '2', '3'],
      correctIndex: 1,
    },
    {
      id: 'numbers-q3',
      prompt: 'Which number is three?',
      options: ['1', '3', '2'],
      correctIndex: 1,
    },
  ],
  birds: [
    {
      id: 'birds-q1',
      prompt: 'Which one is a bird?',
      options: ['Parrot', 'Cat', 'Dog'],
      correctIndex: 0,
    },
    {
      id: 'birds-q2',
      prompt: 'Which bird has colorful feathers?',
      options: ['Sparrow', 'Peacock', 'Crow'],
      correctIndex: 1,
    },
    {
      id: 'birds-q3',
      prompt: 'Which bird is small and quick?',
      options: ['Sparrow', 'Eagle', 'Ostrich'],
      correctIndex: 0,
    },
  ],
  animals: [
    {
      id: 'animals-q1',
      prompt: 'Which one says "Meow"?',
      options: ['Dog', 'Cat', 'Cow'],
      correctIndex: 1,
    },
    {
      id: 'animals-q2',
      prompt: 'Which one is very big and gentle?',
      options: ['Elephant', 'Goat', 'Rabbit'],
      correctIndex: 0,
    },
    {
      id: 'animals-q3',
      prompt: 'Which one says "Woof"?',
      options: ['Dog', 'Cat', 'Sheep'],
      correctIndex: 0,
    },
  ],
};
