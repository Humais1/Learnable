export type LessonCategory = 'letters' | 'numbers' | 'birds' | 'animals';

export type Lesson = {
  id: string;
  title: string;
  prompt: string;
  target: string;
};

export const LESSON_CATEGORIES: { id: LessonCategory; label: string }[] = [
  { id: 'letters', label: 'Letters' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'birds', label: 'Birds' },
  { id: 'animals', label: 'Animals' },
];

export const LESSONS: Record<LessonCategory, Lesson[]> = {
  letters: [
    { id: 'letter-a', title: 'Letter A', prompt: 'A as in Apple', target: 'A' },
    { id: 'letter-b', title: 'Letter B', prompt: 'B as in Ball', target: 'B' },
    { id: 'letter-c', title: 'Letter C', prompt: 'C as in Cat', target: 'C' },
  ],
  numbers: [
    { id: 'number-1', title: 'Number 1', prompt: 'One', target: 'One' },
    { id: 'number-2', title: 'Number 2', prompt: 'Two', target: 'Two' },
    { id: 'number-3', title: 'Number 3', prompt: 'Three', target: 'Three' },
  ],
  birds: [
    { id: 'bird-parrot', title: 'Parrot', prompt: 'Parrot says hello', target: 'Parrot' },
    { id: 'bird-sparrow', title: 'Sparrow', prompt: 'Small and quick', target: 'Sparrow' },
    { id: 'bird-peacock', title: 'Peacock', prompt: 'Beautiful feathers', target: 'Peacock' },
  ],
  animals: [
    { id: 'animal-cat', title: 'Cat', prompt: 'Meow', target: 'Cat' },
    { id: 'animal-dog', title: 'Dog', prompt: 'Woof', target: 'Dog' },
    { id: 'animal-elephant', title: 'Elephant', prompt: 'Big and gentle', target: 'Elephant' },
  ],
};
