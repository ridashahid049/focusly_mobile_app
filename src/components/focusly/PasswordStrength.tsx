import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../../constants/colors';
import { getPasswordStrength } from '../../utils/validation';

const STRENGTH_TRANSITION = { type: 'timing', duration: 220 } as MotiTransition;

const CONFIG = {
  weak: { label: 'Weak', color: colors.danger, width: '33%' },
  fair: { label: 'Fair', color: colors.lightViolet, width: '66%' },
  strong: { label: 'Strong', color: colors.success, width: '100%' },
} as const;

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const cfg = CONFIG[strength];

  return (
    <View style={styles.container} accessibilityLabel={`Password strength: ${cfg.label}`}>
      <View style={styles.track}>
        <MotiView
          animate={{ width: cfg.width, backgroundColor: cfg.color }}
          transition={STRENGTH_TRANSITION}
          style={styles.fill}
        />
      </View>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: radius.pill,
  },
  label: { fontSize: 12, fontWeight: '700' },
});
