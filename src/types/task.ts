export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'study' | 'personal';

export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: string; // ISO
  completedAt?: string; // ISO, used for the weekly summary
};

export type TaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  category: Category;
};

export type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed';

export type Settings = {
  showCompletedToday: boolean;
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  work: 'Work',
  study: 'Study',
  personal: 'Personal',
};