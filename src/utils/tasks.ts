import { Priority, Task, TaskFilter } from '../types/task';
import { addDays, toDateKey, weekdayLabel } from './date';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const ad = a.dueDate ?? '9999-99-99';
    const bd = b.dueDate ?? '9999-99-99';
    if (ad !== bd) return ad < bd ? -1 : 1;
    if (a.priority !== b.priority) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
  today: string
): Task[] {
  switch (filter) {
    case 'today':
      return tasks.filter((t) => t.dueDate === today);
    case 'upcoming':
      return tasks.filter(
        (t) => !t.completed && !!t.dueDate && t.dueDate > today
      );
    case 'completed':
      return tasks.filter((t) => t.completed);
    default:
      return tasks;
  }
}

export function getTodayTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => t.dueDate === today);
}

export function getStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, percent };
}

export type WeekDay = { key: string; label: string; completed: number };

export function getWeeklySummary(tasks: Task[], today: string) {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) keys.push(addDays(today, -i));

  const completedByDay: Record<string, number> = {};
  keys.forEach((k) => (completedByDay[k] = 0));

  let createdThisWeek = 0;
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const k = toDateKey(new Date(t.completedAt));
      if (k in completedByDay) completedByDay[k] += 1;
    }
    const created = toDateKey(new Date(t.createdAt));
    if (created >= keys[0] && created <= today) createdThisWeek += 1;
  });

  const days: WeekDay[] = keys.map((k) => ({
    key: k,
    label: weekdayLabel(k),
    completed: completedByDay[k],
  }));
  const completedThisWeek = days.reduce((sum, d) => sum + d.completed, 0);

  return { days, completedThisWeek, createdThisWeek };
}