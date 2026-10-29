import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/colors';
import { useTasks } from '../context/tasks-context';
import { Screen } from '../components/focusly/Screen';
import { Button } from '../components/focusly/Button';
import { EmptyState } from '../components/focusly/EmptyState';
import {
  CATEGORY_LABELS,
  Category,
  PRIORITY_LABELS,
  Priority,
} from '../types/task';
import { addDays, isValidDateKey, todayKey } from '../utils/date';
import { confirmAction } from '../utils/confirm';

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function TaskFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();

  const isEdit = !!id;
  const editing = useMemo(
    () => (id ? tasks.find((t) => t.id === id) : undefined),
    [id, tasks]
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayKey());
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('work');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hydrated = useRef(false);
  useEffect(() => {
    if (editing && !hydrated.current) {
      hydrated.current = true;
      setTitle(editing.title);
      setDescription(editing.description ?? '');
      setDueDate(editing.dueDate ?? '');
      setPriority(editing.priority);
      setCategory(editing.category);
    }
  }, [editing]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleSave = async () => {
    setFormError(null);
    const trimmedTitle = title.trim();
    const trimmedDate = dueDate.trim();

    let valid = true;
    if (!trimmedTitle) {
      setTitleError('Please enter a task title.');
      valid = false;
    } else {
      setTitleError(null);
    }
    if (trimmedDate && !isValidDateKey(trimmedDate)) {
      setDateError('Use the format YYYY-MM-DD, for example 2026-11-05.');
      valid = false;
    } else {
      setDateError(null);
    }
    if (!valid) return;

    setSaving(true);
    try {
      const input = {
        title: trimmedTitle,
        description,
        dueDate: trimmedDate,
        priority,
        category,
      };
      if (isEdit && id) await updateTask(id, input);
      else await addTask(input);
      goBack();
    } catch {
      setFormError('Something went wrong while saving. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    confirmAction(
      'Delete task',
      `Delete "${editing.title}"? This cannot be undone.`,
      'Delete',
      async () => {
        await deleteTask(editing.id);
        goBack();
      }
    );
  };

  if (isEdit && !loading && !editing) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Task not found"
          message="This task may have been deleted."
        />
        <Button title="Go back" variant="secondary" onPress={goBack} />
      </Screen>
    );
  }

  const today = todayKey();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{isEdit ? 'Edit Task' : 'Add Task'}</Text>
        <Pressable
          onPress={goBack}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (titleError) setTitleError(null);
          }}
          placeholder="What do you need to do?"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, !!titleError && styles.inputError]}
          maxLength={120}
          accessibilityLabel="Task title"
        />
        {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add some details"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.multiline]}
          multiline
          maxLength={500}
          accessibilityLabel="Task description"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Due date</Text>
        <TextInput
          value={dueDate}
          onChangeText={(text) => {
            setDueDate(text);
            if (dateError) setDateError(null);
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, !!dateError && styles.inputError]}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={10}
          accessibilityLabel="Due date"
        />
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
        <View style={styles.chipRow}>
          <Chip label="Today" active={dueDate === today} onPress={() => setDueDate(today)} />
          <Chip
            label="Tomorrow"
            active={dueDate === addDays(today, 1)}
            onPress={() => setDueDate(addDays(today, 1))}
          />
          <Chip
            label="Next week"
            active={dueDate === addDays(today, 7)}
            onPress={() => setDueDate(addDays(today, 7))}
          />
          <Chip label="No date" active={dueDate === ''} onPress={() => setDueDate('')} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <Chip
              key={p}
              label={PRIORITY_LABELS[p]}
              active={priority === p}
              onPress={() => setPriority(p)}
            />
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {(['work', 'study', 'personal'] as Category[]).map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              active={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
      </View>

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      <View style={styles.actions}>
        <Button
          title={isEdit ? 'Save Changes' : 'Save Task'}
          icon="checkmark"
          onPress={handleSave}
          disabled={saving}
          style={{ flex: 1 }}
        />
        <Button title="Cancel" variant="secondary" onPress={goBack} style={{ flex: 1 }} />
      </View>

      {isEdit ? (
        <Button
          title="Delete task"
          variant="danger"
          icon="trash-outline"
          onPress={handleDelete}
        />
      ) : null}
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
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 48,
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  actions: { flexDirection: 'row', gap: spacing.md },
});