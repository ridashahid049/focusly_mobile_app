import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Settings, Task, TaskInput } from '../types/task';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  loadTasks,
  saveSettings,
  saveTasks,
} from '../utils/storage';

type TasksContextValue = {
  tasks: Task[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, input: TaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanInput(input: TaskInput): TaskInput {
  const description = input.description?.trim();
  const dueDate = input.dueDate?.trim();
  return {
    title: input.title.trim(),
    description: description ? description : undefined,
    dueDate: dueDate ? dueDate : undefined,
    priority: input.priority,
    category: input.category,
  };
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tasksRef = useRef<Task[]>([]);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedTasks, savedSettings] = await Promise.all([
          loadTasks(),
          loadSettings(),
        ]);
        if (!active) return;
        tasksRef.current = savedTasks;
        settingsRef.current = savedSettings;
        setTasks(savedTasks);
        setSettings(savedSettings);
      } catch {
        if (active) {
          setError('Could not load your saved tasks. Starting with an empty list.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const commitTasks = useCallback(async (next: Task[]) => {
    tasksRef.current = next;
    setTasks(next);
    try {
      await saveTasks(next);
    } catch {
      setError('Your change could not be saved to this device.');
    }
  }, []);

  const addTask = useCallback(
    async (input: TaskInput) => {
      const clean = cleanInput(input);
      const task: Task = {
        id: createId(),
        ...clean,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      await commitTasks([task, ...tasksRef.current]);
    },
    [commitTasks]
  );

  const updateTask = useCallback(
    async (id: string, input: TaskInput) => {
      const clean = cleanInput(input);
      await commitTasks(
        tasksRef.current.map((t) => (t.id === id ? { ...t, ...clean } : t))
      );
    },
    [commitTasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await commitTasks(tasksRef.current.filter((t) => t.id !== id));
    },
    [commitTasks]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      await commitTasks(
        tasksRef.current.map((t) => {
          if (t.id !== id) return t;
          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        })
      );
    },
    [commitTasks]
  );

  const clearAllTasks = useCallback(async () => {
    await commitTasks([]);
  }, [commitTasks]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    try {
      await saveSettings(next);
    } catch {
      setError('Your settings could not be saved.');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      settings,
      loading,
      error,
      clearError,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      clearAllTasks,
      updateSettings,
    }),
    [
      tasks,
      settings,
      loading,
      error,
      clearError,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      clearAllTasks,
      updateSettings,
    ]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
}