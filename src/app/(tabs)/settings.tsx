import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/colors';
import { useTasks } from '../../context/tasks-context';
import { useAuth } from '../../context/auth-context';
import { Screen } from '../../components/focusly/Screen';
import { Button } from '../../components/focusly/Button';
import { ProfileButton } from '../../components/focusly/ProfileButton';
import { ProfileMenu } from '../../components/focusly/ProfileMenu';
import { confirmAction } from '../../utils/confirm';
import { getDisplayName } from '../../utils/user';

export default function SettingsScreen() {
  const { tasks, settings, updateSettings, clearAllTasks } = useTasks();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const email = user?.email ?? 'Signed in';
  const displayName = getDisplayName(user);

  return (
    <Screen>
      <ProfileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <ProfileButton onPress={() => setMenuOpen(true)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Ionicons name="person-circle-outline" size={22} color={colors.lightViolet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefLabel} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.muted} numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>
        <Button
          title="Sign out"
          variant="danger"
          icon="log-out-outline"
          onPress={() =>
            confirmAction(
              'Sign out',
              'You will need to sign in again to access your tasks on this device.',
              'Sign out',
              () => {
                void signOut();
              }
            )
          }
        />
      </View>

      <View style={styles.card}>
        <View style={styles.appRow}>
          <View style={styles.logo}>
            <Ionicons name="flash" size={22} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Focusly</Text>
            <Text style={styles.muted}>Version 1.0.0</Text>
          </View>
        </View>
        <Text style={styles.muted}>
          A simple productivity app to organize your tasks, track deadlines and
          monitor your progress. Your tasks are stored on this device only.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <View style={styles.prefRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefLabel}>Show completed tasks on Home</Text>
            <Text style={styles.muted}>
              Keep finished tasks visible in today's list.
            </Text>
          </View>
          <Switch
            value={settings.showCompletedToday}
            onValueChange={(value) => updateSettings({ showCompletedToday: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
            accessibilityLabel="Show completed tasks on Home"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data</Text>
        <Text style={styles.muted}>
          You have {tasks.length} saved {tasks.length === 1 ? 'task' : 'tasks'}.
        </Text>
        <Button
          title="Clear all tasks"
          variant="danger"
          icon="trash-outline"
          disabled={tasks.length === 0}
          onPress={() =>
            confirmAction(
              'Clear all tasks',
              'This will permanently delete all of your tasks. This cannot be undone.',
              'Delete all',
              () => clearAllTasks()
            )
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prefLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
