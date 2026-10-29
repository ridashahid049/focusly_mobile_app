import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../constants/colors';

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});