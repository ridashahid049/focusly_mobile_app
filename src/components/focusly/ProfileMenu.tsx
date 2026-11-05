import React, { useCallback, useEffect } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../../constants/colors';
import { useAuth } from '../../context/auth-context';
import { confirmAction } from '../../utils/confirm';
import { getDisplayName } from '../../utils/user';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const ENTER = { type: 'timing', duration: 160 } as MotiTransition;

export function ProfileMenu({ visible, onClose }: Props) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [reducedMotion, setReducedMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);
    return () => {
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [visible, close]);

  const openProfile = () => {
    close();
    router.push('/profile' as never);
  };

  const doLogout = () => {
    close();
    confirmAction(
      'Log out',
      'You will need to sign in again to access your tasks on this device.',
      'Log out',
      () => {
        void signOut();
      }
    );
  };

  const name = getDisplayName(user);
  const email = typeof user?.email === 'string' ? user.email : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.root} pointerEvents="box-none">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        <MotiView
          pointerEvents="box-none"
          from={
            reducedMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.96, translateY: -6 }
          }
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={reducedMotion ? ({ type: 'timing', duration: 1 } as MotiTransition) : ENTER}
          style={styles.anchor}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            </View>
            <View style={styles.divider} />
            <Pressable
              onPress={openProfile}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Ionicons name="person-outline" size={20} color={colors.text} />
              <Text style={styles.itemText}>Profile</Text>
            </Pressable>
            <Pressable
              onPress={doLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.itemText, styles.dangerText]}>Log out</Text>
            </Pressable>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  anchor: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    alignItems: 'flex-end',
  },
  card: {
    minWidth: 220,
    maxWidth: 280,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  email: { color: colors.textSecondary, fontSize: 13 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  item: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  itemPressed: { backgroundColor: colors.elevated },
  itemText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dangerText: { color: colors.danger },
});
