import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  value: string | number;
  icon: IconName;
  accent?: string;
};

export function StatCard({ label, value, icon, accent = colors.lightViolet }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={20} color={accent} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  value: { color: colors.text, fontSize: 28, fontWeight: '800' },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});