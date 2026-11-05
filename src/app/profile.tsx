import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../constants/colors';
import { useAuth } from '../context/auth-context';
import { Screen } from '../components/focusly/Screen';
import { Button } from '../components/focusly/Button';
import { confirmAction } from '../utils/confirm';
import { isValidDateKey, todayKey } from '../utils/date';
import {
  normalizeName,
  normalizeDob,
  normalizePhone,
  validateDob,
  validateName,
  validatePhone,
} from '../utils/validation';
import {
  GenderValue,
  getDisplayName,
  getInitials,
  getProfileFields,
} from '../utils/user';

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

type Banner = { kind: 'success' | 'error'; text: string } | null;

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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, signOut } = useAuth();
  const [reducedMotion, setReducedMotion] = useState(false);

  const currentName = useMemo(() => getDisplayName(user), [user]);
  const email = typeof user?.email === 'string' ? user.email : '';
  const profile = useMemo(() => getProfileFields(user), [user]);

  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(profile.phone);
  const [gender, setGender] = useState<GenderValue>(profile.gender);
  const [dob, setDob] = useState(profile.dob);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const hydratedRef = useRef<string | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReducedMotion);
    return () => {
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, []);

  useEffect(() => {
    const key = user?.id ?? '';
    if (hydratedRef.current === key) return;
    hydratedRef.current = key;
    setName(currentName);
    setPhone(profile.phone);
    setGender(profile.gender);
    setDob(profile.dob);
    setNameError(null);
    setPhoneError(null);
    setDobError(null);
    setBanner(null);
  }, [user?.id, currentName, profile.phone, profile.gender, profile.dob]);

  const cleanName = normalizeName(name);
  const cleanPhone = normalizePhone(phone);
  const cleanDob = normalizeDob(dob);

  const hasChanges =
    cleanName !== normalizeName(currentName) ||
    cleanPhone !== normalizePhone(profile.phone) ||
    gender !== profile.gender ||
    cleanDob !== normalizeDob(profile.dob);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/' as never);
  };

  const onCancel = () => {
    setName(currentName);
    setPhone(profile.phone);
    setGender(profile.gender);
    setDob(profile.dob);
    setNameError(null);
    setPhoneError(null);
    setDobError(null);
    setBanner(null);
  };

  const onSave = async () => {
    if (saving || !hasChanges) return;
    setBanner(null);
    const nextNameError = validateName(name);
    const nextPhoneError = validatePhone(phone);
    const nextDobError = validateDob(dob, todayKey());
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);
    setDobError(nextDobError);
    if (nextNameError || nextPhoneError || nextDobError) return;

    setSaving(true);
    // Metadata is user-editable; saved here only for display/profile details, never for authorization.
    const result = await updateProfile({
      display_name: cleanName,
      full_name: cleanName,
      phone: cleanPhone,
      gender,
      dob: cleanDob,
    });
    setSaving(false);

    if (!result.ok) {
      setBanner({ kind: 'error', text: result.message });
      return;
    }
    setBanner({ kind: 'success', text: 'Profile updated' });
  };

  const onLogout = () => {
    confirmAction(
      'Log out',
      'You will need to sign in again to access your tasks on this device.',
      'Log out',
      () => {
        void signOut();
      }
    );
  };

  const enter = (delay: number): MotiTransition =>
    (reducedMotion
      ? { type: 'timing', duration: 1 }
      : { type: 'timing', duration: 320, delay }) as MotiTransition;

  return (
    <Screen>
      <MotiView
        from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(0)}
        style={styles.header}
      >
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </MotiView>

      <MotiView
        from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(60)}
        style={styles.topCard}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user)}</Text>
        </View>
        <Text style={styles.nameText} numberOfLines={1}>
          {currentName}
        </Text>
        <Text style={styles.emailText} numberOfLines={1}>
          {email}
        </Text>
      </MotiView>

      <MotiView
        from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(120)}
        style={styles.card}
      >
        {banner ? (
          <View
            style={[
              styles.banner,
              banner.kind === 'success' ? styles.bannerSuccess : styles.bannerError,
            ]}
            accessibilityRole="alert"
          >
            <Ionicons
              name={banner.kind === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={banner.kind === 'success' ? colors.success : colors.danger}
              style={styles.bannerIcon}
            />
            <Text
              style={[
                styles.bannerText,
                banner.kind === 'success' ? styles.bannerTextSuccess : styles.bannerTextError,
              ]}
              accessibilityLiveRegion="polite"
            >
              {banner.text}
            </Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Full name *</Text>
          <View style={[styles.inputWrap, !!nameError && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Pressable style={styles.inputPressable} accessibilityRole="none">
              <TextInputShim
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (nameError) setNameError(null);
                }}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                maxLength={50}
              />
            </Pressable>
          </View>
          {nameError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{nameError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrap, styles.readOnlyWrap]}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {email}
            </Text>
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
          </View>
          <Text style={styles.hint}>Email can't be changed here.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number (optional)</Text>
          <View style={[styles.inputWrap, !!phoneError && styles.inputError]}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Pressable style={styles.inputPressable} accessibilityRole="none">
              <TextInputShim
                value={phone}
                onChangeText={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError(null);
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={20}
                placeholder="+1 555 000 0000"
              />
            </Pressable>
          </View>
          {phoneError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{phoneError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender (optional)</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={gender === opt.value}
                onPress={() => setGender((g) => (g === opt.value ? '' : opt.value))}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date of birth (optional)</Text>
          <View style={[styles.inputWrap, !!dobError && styles.inputError]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            <Pressable style={styles.inputPressable} accessibilityRole="none">
              <TextInputShim
                value={dob}
                onChangeText={(v) => {
                  setDob(v);
                  if (dobError) setDobError(null);
                }}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={10}
                keyboardType={undefined}
              />
            </Pressable>
          </View>
          {dobError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{dobError}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Button
            title="Save changes"
            icon="checkmark"
            onPress={onSave}
            loading={saving}
            disabled={saving || !hasChanges}
            style={{ flex: 1 }}
          />
          <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        </View>
      </MotiView>

      <MotiView
        from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(180)}
      >
        <Button title="Log out" variant="danger" icon="log-out-outline" onPress={onLogout} />
      </MotiView>
    </Screen>
  );
}

function TextInputShim({
  value,
  onChangeText,
  placeholder,
  ...rest
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  [key: string]: unknown;
}) {
  // Inline to avoid importing extra component; matches AuthInput/task-form input styling behavior.
  const { TextInput } = require('react-native') as typeof import('react-native');
  return (
    <TextInput
      {...(rest as object)}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={styles.textInput}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 44, height: 44 },
  topCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: { color: colors.lightViolet, fontSize: 26, fontWeight: '800' },
  nameText: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emailText: { color: colors.textSecondary, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  bannerError: {
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
  bannerIcon: { marginTop: 1, marginRight: spacing.sm },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  bannerTextSuccess: { color: colors.success },
  bannerTextError: { color: colors.danger },
  field: { gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.danger },
  readOnlyWrap: { opacity: 0.9 },
  inputIcon: { marginRight: spacing.sm },
  inputPressable: { flex: 1 },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  readOnlyText: { flex: 1, color: colors.textSecondary, fontSize: 16 },
  hint: { color: colors.textSecondary, fontSize: 12 },
  errorText: { color: colors.danger, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.md },
});
