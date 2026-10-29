import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../../constants/colors';
import { useTasks } from '../../context/tasks-context';
import { Screen } from '../../components/focusly/Screen';
import { Button } from '../../components/focusly/Button';
import { EmptyState } from '../../components/focusly/EmptyState';
import { TaskCard } from '../../components/focusly/TaskCard';
import { TaskFilter } from '../../types/task';
import { todayKey } from '../../utils/date';
import { filterTasks, sortTasks } from '../../utils/tasks';
import { confirmAction } from '../../utils/confirm';

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const EMPTY_MESSAGES: Record<TaskFilter, string> = {
  all: 'You have no tasks yet. Add one to get started.',
  today: 'No tasks are due today.',
  upcoming: 'No upcoming tasks with a future due date.',
  completed: 'You have not completed any tasks yet.',
};

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, loading, error, clearError, toggleTask, deleteTask } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const today = todayKey();

  const counts = useMemo(() => {
    const result: Record<TaskFilter, number> = {
      all: tasks.length,
      today: filterTasks(tasks, 'today', today).length,
      upcoming: filterTasks(tasks, 'upcoming', today).length,
      completed: filterTasks(tasks, 'completed', today).length,
    };
    return result;
  }, [tasks, today]);

  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, filter, today)),
    [tasks, filter, today]
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>All Tasks</Text>
        <Button
          title="Add"
          icon="add"
          onPress={() => router.push('/task-form')}
          style={styles.addButton}
        />
      </View>

      {error ? (
        <Pressable onPress={clearError} style={styles.errorBox}>
          <Text style={styles.errorText}>{error} (tap to dismiss)</Text>
        </Pressable>
      ) : null}

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label} ({counts[f.key]})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.lightViolet} size="large" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="file-tray-outline"
          title="Nothing here"
          message={EMPTY_MESSAGES[filter]}
          actionLabel={filter === 'all' ? 'Add a task' : undefined}
          onAction={filter === 'all' ? () => router.push('/task-form') : undefined}
        />
      ) : (
        visible.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={() => toggleTask(task.id)}
            onEdit={() =>
              router.push({ pathname: '/task-form', params: { id: task.id } })
            }
            onDelete={() =>
              confirmAction(
                'Delete task',
                `Delete "${task.title}"? This cannot be undone.`,
                'Delete',
                () => deleteTask(task.id)
              )
            }
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  addButton: { minHeight: 44, paddingHorizontal: spacing.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.text },
  errorBox: {
    backgroundColor: colors.elevated,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13 },
});