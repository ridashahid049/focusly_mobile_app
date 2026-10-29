import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, Task } from '../types/task';

const TASKS_KEY = 'focusly:tasks:v1';
const SETTINGS_KEY = 'focusly:settings:v1';

export const DEFAULT_SETTINGS: Settings = { showCompletedToday: true };

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

export async function loadTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isTask);
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  const parsed = JSON.parse(raw) as Partial<Settings>;
  return {
    showCompletedToday:
      typeof parsed.showCompletedToday === 'boolean'
        ? parsed.showCompletedToday
        : DEFAULT_SETTINGS.showCompletedToday,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}