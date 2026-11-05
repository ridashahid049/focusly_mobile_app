import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, Task } from '../types/task';

const TASKS_PREFIX = 'focusly:tasks:v1';
const SETTINGS_PREFIX = 'focusly:settings:v1';

export const DEFAULT_SETTINGS: Settings = { showCompletedToday: true };

function tasksKey(userId: string): string {
  return `${TASKS_PREFIX}:${userId}`;
}

function settingsKey(userId: string): string {
  return `${SETTINGS_PREFIX}:${userId}`;
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.createdAt === 'string' &&
    (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high') &&
    (t.category === 'work' || t.category === 'study' || t.category === 'personal')
  );
}

export async function loadTasks(userId: string): Promise<Task[]> {
  if (!userId) return [];
  const raw = await AsyncStorage.getItem(tasksKey(userId));
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isTask);
}

export async function saveTasks(userId: string, tasks: Task[]): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(tasksKey(userId), JSON.stringify(tasks));
}

export async function loadSettings(userId: string): Promise<Settings> {
  if (!userId) return DEFAULT_SETTINGS;
  const raw = await AsyncStorage.getItem(settingsKey(userId));
  if (!raw) return DEFAULT_SETTINGS;
  const parsed = JSON.parse(raw) as Partial<Settings>;
  return {
    showCompletedToday:
      typeof parsed.showCompletedToday === 'boolean'
        ? parsed.showCompletedToday
        : DEFAULT_SETTINGS.showCompletedToday,
  };
}

export async function saveSettings(userId: string, settings: Settings): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(settingsKey(userId), JSON.stringify(settings));
}
