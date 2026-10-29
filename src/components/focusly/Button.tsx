import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: Props) {
  const textColor =
    variant === 'primary'
      ? colors.text
      : variant === 'danger'
        ? colors.danger
        : colors.lightViolet;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.elevated, borderColor: colors.border },
  danger: { backgroundColor: 'transparent', borderColor: colors.danger },
  text: { fontSize: 16, fontWeight: '700' },
});