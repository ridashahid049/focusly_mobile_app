import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, useAnimationState } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../../constants/colors';
import { SIGN_UP_CHECK_INBOX, SIGN_UP_CREATED_MESSAGE, useAuth } from '../../context/auth-context';
import { AuthBackdrop } from '../../components/focusly/AuthBackdrop';
import { AuthInput } from '../../components/focusly/AuthInput';
import { Button } from '../../components/focusly/Button';
import { PasswordStrength } from '../../components/focusly/PasswordStrength';
import {
  normalizeEmail,
  normalizeName,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shakeState = useAnimationState({
    from: { translateX: 0 },
    shake: { translateX: 0 },
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReducedMotion
    );
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startLock = () => {
    // UX-level slowdown only. Real brute-force protection is Supabase server-side rate limiting.
    setLockRemaining(LOCK_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLockRemaining((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setFailedAttempts(0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const triggerShake = () => {
    if (reducedMotion) return;
    shakeState.transitionTo('shake');
  };

  const goToSignIn = (params: { email?: string; created?: '1'; notice?: string }) => {
    router.replace({ pathname: '/(auth)/sign-in', params } as never);
  };

  const onSubmit = async () => {
    if (submitting || lockRemaining > 0) return;
    setFormError(null);
    const nextNameError = validateName(fullName);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validateConfirmPassword(password, confirm);
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextNameError || nextEmailError || nextPasswordError || nextConfirmError) return;

    const cleanName = normalizeName(fullName);
    const cleanEmail = normalizeEmail(email);
    setSubmitting(true);
    const result = await signUp(cleanName, cleanEmail, password);
    setSubmitting(false);

    if (!result.ok) {
      setPassword('');
      setConfirm('');
      const isAttemptFailure =
        result.message === 'Enter a valid email address.' ||
        result.message === 'Choose a stronger password.' ||
        result.message === 'Enter your full name.' ||
        result.message === 'Name must be at least 2 characters.' ||
        result.message === 'Name must be 50 characters or fewer.' ||
        result.message === 'Use letters, spaces, apostrophes, hyphens, or dots only.';
      if (isAttemptFailure) {
        triggerShake();
      }
      if (result.message === SIGN_UP_CHECK_INBOX) {
        // Keep the neutral sign-up message behavior for already-registered emails.
        goToSignIn({ email: cleanEmail, notice: SIGN_UP_CHECK_INBOX });
        return;
      }
      setFormError(result.message);
      setFailedAttempts((count) => {
        const next = count + 1;
        if (next >= MAX_ATTEMPTS && result.message.includes('Too many attempts')) startLock();
        return next;
      });
      return;
    }

    setPassword('');
    setConfirm('');
    if (checkInbox) return;
    goToSignIn({ email: cleanEmail, created: '1' });
  };

  const locked = lockRemaining > 0;
  const enterTransition = { type: 'timing', duration: 320 } as MotiTransition;
  const cardTransition = (
    reducedMotion
      ? { type: 'timing', duration: 1 }
      : {
          opacity: { type: 'timing', duration: 360, delay: 80 },
          translateY: { type: 'timing', duration: 360, delay: 80 },
          translateX: { type: 'spring', damping: 10, mass: 0.3, stiffness: 220 },
        }
  ) as MotiTransition;
  const inboxTransition = { type: 'timing', duration: 240 } as MotiTransition;

  return (
    <View style={styles.root}>
      <AuthBackdrop />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <MotiView
              from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={enterTransition}
              style={styles.brand}
            >
              <View style={styles.logoWrap}>
                <Ionicons name="flash" size={28} color={colors.text} />
              </View>
              <Text style={styles.wordmark}>Focusly</Text>
              <Text style={styles.tagline}>Create an account to keep your tasks in sync.</Text>
            </MotiView>

            <MotiView
              state={shakeState}
              from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={cardTransition}
              style={styles.card}
            >
              {checkInbox ? (
                <MotiView
                  from={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={inboxTransition}
                  style={styles.inboxPanel}
                >
                  <View style={styles.inboxIcon}>
                    <Ionicons name="mail-open-outline" size={30} color={colors.lightViolet} />
                  </View>
                  <Text style={styles.title}>Check your inbox</Text>
                  <Text style={styles.inboxText}>{SIGN_UP_CHECK_INBOX}</Text>
                  <Button
                    title="Back to sign in"
                    onPress={() => goToSignIn({ email: normalizeEmail(email) })}
                  />
                </MotiView>
              ) : (
                <>
                  <Text style={styles.title}>Create account</Text>

                  <AuthInput
                    label="Full name"
                    icon="person-outline"
                    value={fullName}
                    onChangeText={(value) => {
                      setFullName(value);
                      if (nameError) setNameError(null);
                    }}
                    error={nameError}
                    autoCapitalize="words"
                    autoCorrect={false}
                    autoComplete="name"
                    textContentType="name"
                    maxLength={50}
                    returnKeyType="next"
                  />

                  <AuthInput
                    label="Email"
                    icon="mail-outline"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (emailError) setEmailError(null);
                    }}
                    error={emailError}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    maxLength={254}
                    returnKeyType="next"
                  />

                  <View style={styles.passwordGroup}>
                    <AuthInput
                      label="Password"
                      icon="lock-closed-outline"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (passwordError) setPasswordError(null);
                      }}
                      error={passwordError}
                      isPassword
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      maxLength={72}
                      returnKeyType="next"
                    />
                    <PasswordStrength password={password} />
                  </View>

                  <AuthInput
                    label="Confirm password"
                    icon="shield-checkmark-outline"
                    value={confirm}
                    onChangeText={(value) => {
                      setConfirm(value);
                      if (confirmError) setConfirmError(null);
                    }}
                    error={confirmError}
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    maxLength={72}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />

                  {formError ? (
                    <Text
                      style={styles.formError}
                      accessibilityLiveRegion="polite"
                      accessibilityRole="alert"
                    >
                      {formError}
                    </Text>
                  ) : null}

                  {locked ? (
                    <Text style={styles.lockText} accessibilityLiveRegion="polite">
                      Too many attempts. Try again in {lockRemaining}s.
                    </Text>
                  ) : null}

                  <Button
                    title={locked ? `Wait ${lockRemaining}s` : 'Create account'}
                    onPress={onSubmit}
                    loading={submitting}
                    disabled={submitting || locked}
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Already have an account?</Text>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel="Sign in"
                      onPress={() => router.push('/(auth)/sign-in' as never)}
                    >
                      <Text style={styles.switchLink}>Sign in</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    gap: spacing.xl,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { color: colors.text, fontSize: 30, fontWeight: '800' },
  tagline: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  passwordGroup: { gap: spacing.sm },
  formError: { color: colors.danger, fontSize: 13 },
  lockText: { color: colors.lightViolet, fontSize: 13, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  switchText: { color: colors.textSecondary, fontSize: 14 },
  switchLink: { color: colors.lightViolet, fontSize: 14, fontWeight: '700' },
  inboxPanel: { alignItems: 'center', gap: spacing.md },
  inboxIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
