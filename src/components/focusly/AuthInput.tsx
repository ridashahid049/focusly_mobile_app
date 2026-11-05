import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../../constants/colors';

const ERROR_TRANSITION = { type: 'timing', duration: 180 } as MotiTransition;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
  isPassword?: boolean;
};

export function AuthInput({
  label,
  icon,
  error,
  containerStyle,
  isPassword,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor }]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.lightViolet : colors.textSecondary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword ? !visible : inputProps.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={styles.eye}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={ERROR_TRANSITION}
        >
          <Text
            style={styles.error}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </Text>
        </MotiView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  eye: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  error: { color: colors.danger, fontSize: 13 },
});
