import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../context/auth-context';
import { getInitials } from '../../utils/user';

type Props = {
  onPress: () => void;
};

export function ProfileButton({ onPress }: Props) {
  const { user } = useAuth();
  const initials = getInitials(user);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open profile menu"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={4}
    >
      <Text style={styles.text}>{initials}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  text: {
    color: colors.lightViolet,
    fontSize: 14,
    fontWeight: '800',
  },
});
