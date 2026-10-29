import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';
import { Button } from './Button';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.lightViolet} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} icon="add" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});