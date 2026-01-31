export type LessonCategory = 'letters' | 'numbers' | 'birds' | 'animals';

export type Lesson = {
  id: string;
  title: string;
  prompt: string;
};

export const LESSON_CATEGORIES: { id: LessonCategory; label: string }[] = [
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'birds', label: 'Birds' },
  { id: 'animals', label: 'Animals' },
];

export const LESSONS: Record<LessonCategory, Lesson[]> = {
  letters: [
    { id: 'letter-a', title: 'Letter A', prompt: 'A as in Apple' },
    { id: 'letter-b', title: 'Letter B', prompt: 'B as in Ball' },
    { id: 'letter-c', title: 'Letter C', prompt: 'C as in Cat' },
  ],
  numbers: [
    { id: 'number-1', title: 'Number 1', prompt: 'One' },
    { id: 'number-2', title: 'Number 2', prompt: 'Two' },
    { id: 'number-3', title: 'Number 3', prompt: 'Three' },
  ],
  birds: [
    { id: 'bird-parrot', title: 'Parrot', prompt: 'Parrot says hello' },
    { id: 'bird-sparrow', title: 'Sparrow', prompt: 'Small and quick' },
    { id: 'bird-peacock', title: 'Peacock', prompt: 'Beautiful feathers' },
  ],
  animals: [
    { id: 'animal-cat', title: 'Cat', prompt: 'Meow' },
    { id: 'animal-dog', title: 'Dog', prompt: 'Woof' },
    { id: 'animal-elephant', title: 'Elephant', prompt: 'Big and gentle' },
  ],
};
