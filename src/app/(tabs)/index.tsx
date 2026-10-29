import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';
import { useTasks } from '../../context/tasks-context';
import { Screen } from '../../components/focusly/Screen';
import { Button } from '../../components/focusly/Button';
import { StatCard } from '../../components/focusly/StatCard';
import { ProgressBar } from '../../components/focusly/ProgressBar';
import { EmptyState } from '../../components/focusly/EmptyState';
import { TaskCard } from '../../components/focusly/TaskCard';
import { formatLongDate, todayKey } from '../../utils/date';
import { getStats, getTodayTasks, sortTasks } from '../../utils/tasks';
import { confirmAction } from '../../utils/confirm';

export default function DashboardScreen() {
  const router = useRouter();
  const { tasks, settings, loading, error, clearError, toggleTask, deleteTask } =
    useTasks();
  const today = todayKey();

  const stats = useMemo(() => getStats(tasks), [tasks]);
  const todayAll = useMemo(() => getTodayTasks(tasks, today), [tasks, today]);
  const todayVisible = useMemo(
    () =>
      sortTasks(
        settings.showCompletedToday ? todayAll : todayAll.filter((t) => !t.completed)
      ),
    [todayAll, settings.showCompletedToday]
  );
  const todayDone = todayAll.filter((t) => t.completed).length;
  const todayProgress = todayAll.length === 0 ? 0 : todayDone / todayAll.length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="flash" size={18} color={colors.text} />
          </View>
          <Text style={styles.brand}>Focusly</Text>
        </View>
        <Text style={styles.welcome}>Welcome back. Let's make today count.</Text>
        <Text style={styles.date}>{formatLongDate()}</Text>
      </View>

      {error ? (
        <Pressable onPress={clearError} style={styles.errorBox}>
          <Text style={styles.errorText}>{error} (tap to dismiss)</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.lightViolet} size="large" />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Total" value={stats.total} icon="layers-outline" />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon="checkmark-done-outline"
              accent={colors.success}
            />
            <StatCard label="Pending" value={stats.pending} icon="time-outline" />
          </View>

          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.cardTitle}>Today's progress</Text>
              <Text style={styles.progressValue}>
                {todayAll.length === 0 ? '--' : `${Math.round(todayProgress * 100)}%`}
              </Text>
            </View>
            <ProgressBar value={todayProgress} />
            <Text style={styles.muted}>
              {todayAll.length === 0
                ? 'No tasks are due today.'
                : `${todayDone} of ${todayAll.length} tasks due today are done.`}
            </Text>
          </View>

          <Button
            title="Quick Add Task"
            icon="add"
            onPress={() => router.push('/task-form')}
          />

          <Text style={styles.sectionTitle}>Today's tasks</Text>

          {tasks.length === 0 ? (
            <EmptyState
              icon="clipboard-outline"
              title="No tasks yet"
              message="Add your first task to start organizing your day."
              actionLabel="Add your first task"
              onAction={() => router.push('/task-form')}
            />
          ) : todayVisible.length === 0 ? (
            <EmptyState
              icon="sunny-outline"
              title="Nothing due today"
              message="Enjoy the free time, or add a task for today."
            />
          ) : (
            todayVisible.map((task) => (
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
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.text, fontSize: 24, fontWeight: '800' },
  welcome: { color: colors.text, fontSize: 16, marginTop: spacing.sm },
  date: { color: colors.textSecondary, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  progressValue: { color: colors.lightViolet, fontSize: 20, fontWeight: '800' },
  muted: { color: colors.textSecondary, fontSize: 13 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  errorBox: {
    backgroundColor: colors.elevated,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13 },
});