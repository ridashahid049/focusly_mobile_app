import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/colors';
import { useTasks } from '../../context/tasks-context';
import { Screen } from '../../components/focusly/Screen';
import { StatCard } from '../../components/focusly/StatCard';
import { ProgressBar } from '../../components/focusly/ProgressBar';
import { todayKey } from '../../utils/date';
import { getStats, getWeeklySummary } from '../../utils/tasks';

const BAR_MAX_HEIGHT = 96;

export default function StatsScreen() {
  const { tasks } = useTasks();
  const today = todayKey();

  const stats = useMemo(() => getStats(tasks), [tasks]);
  const week = useMemo(() => getWeeklySummary(tasks, today), [tasks, today]);
  const maxDay = Math.max(1, ...week.days.map((d) => d.completed));

  return (
    <Screen>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.row}>
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
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Completion rate</Text>
          <Text style={styles.percent}>{stats.percent}%</Text>
        </View>
        <ProgressBar value={stats.percent / 100} />
        <Text style={styles.muted}>
          {stats.total === 0
            ? 'Add tasks to see your completion rate.'
            : `${stats.completed} of ${stats.total} tasks completed.`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly productivity</Text>
        <Text style={styles.muted}>Tasks completed in the last 7 days</Text>

        <View style={styles.chart}>
          {week.days.map((day) => (
            <View key={day.key} style={styles.barCol}>
              <Text style={styles.barValue}>{day.completed}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height:
                        day.completed === 0
                          ? 4
                          : Math.max(8, (day.completed / maxDay) * BAR_MAX_HEIGHT),
                      opacity: day.completed === 0 ? 0.3 : 1,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{day.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <StatCard
            label="Completed this week"
            value={week.completedThisWeek}
            icon="trophy-outline"
            accent={colors.success}
          />
          <StatCard
            label="Added this week"
            value={week.createdThisWeek}
            icon="add-circle-outline"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  row: { flexDirection: 'row', gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  percent: { color: colors.lightViolet, fontSize: 24, fontWeight: '800' },
  muted: { color: colors.textSecondary, fontSize: 13 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  barCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: '100%',
    maxWidth: 36,
    justifyContent: 'flex-end',
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.sm },
  barLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
});