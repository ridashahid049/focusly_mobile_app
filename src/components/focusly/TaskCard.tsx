import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';
import { CATEGORY_LABELS, PRIORITY_LABELS, Priority, Task } from '../../types/task';
import { formatDueDate, todayKey } from '../../utils/date';

const PRIORITY_COLORS: Record<Priority, string> = {
  high: colors.danger,
  medium: colors.lightViolet,
  low: colors.success,
};

type Props = {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const today = todayKey();
  const overdue = !task.completed && !!task.dueDate && task.dueDate < today;

  return (
    <View style={[styles.card, task.completed && styles.cardDone]}>
      <Pressable
        onPress={onToggle}
        style={styles.iconButton}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={
          task.completed ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`
        }
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={task.completed ? colors.success : colors.textSecondary}
        />
      </Pressable>

      <Pressable
        onPress={onEdit}
        style={styles.body}
        accessibilityRole="button"
        accessibilityLabel={`Open ${task.title}`}
      >
        <Text
          numberOfLines={2}
          style={[styles.title, task.completed && styles.titleDone]}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text numberOfLines={1} style={styles.description}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Badge label={CATEGORY_LABELS[task.category]} color={colors.textSecondary} />
          <Badge
            label={`${PRIORITY_LABELS[task.priority]} priority`}
            color={PRIORITY_COLORS[task.priority]}
          />
          {task.dueDate ? (
            <View style={styles.dueRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={overdue ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.dueText, overdue && { color: colors.danger }]}>
                {formatDueDate(task.dueDate, today)}
                {overdue ? ' (overdue)' : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onDelete}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${task.title}`}
      >
        <Ionicons name="trash-outline" size={22} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  cardDone: { opacity: 0.7 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: spacing.xs, paddingVertical: spacing.xs },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  titleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  description: { color: colors.textSecondary, fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dueText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
});