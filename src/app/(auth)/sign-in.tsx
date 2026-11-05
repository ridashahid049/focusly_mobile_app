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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, useAnimationState } from 'moti';
import type { MotiTransition } from 'moti';
import { colors, radius, spacing } from '../../constants/colors';
import { SIGN_IN_CREDENTIAL_ERROR, SIGN_UP_CREATED_MESSAGE, useAuth } from '../../context/auth-context';
import { AuthBackdrop } from '../../components/focusly/AuthBackdrop';
import { AuthInput } from '../../components/focusly/AuthInput';
import { Button } from '../../components/focusly/Button';
import {
  normalizeEmail,
  validateEmail,
  validateSignInPassword,
} from '../../utils/validation';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string | string[];
    created?: string | string[];
    notice?: string | string[];
  }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appliedParamsRef = useRef<string | null>(null);

  const shakeState = useAnimationState({
    from: { translateX: 0 },
    shake: { translateX: 0 },
  });

  useEffect(() => {
    const nextEmail = firstParam(params.email);
    const created = firstParam(params.created);
    const notice = firstParam(params.notice);
    const key = `${created ?? ''}|${notice ?? ''}|${nextEmail ?? ''}`;
    if (key === appliedParamsRef.current) return;
    appliedParamsRef.current = key;
    if (nextEmail) setEmail(nextEmail);
    if (created === '1') setBanner(SIGN_UP_CREATED_MESSAGE);
    else if (notice) setBanner(notice);
  }, [params.created, params.email, params.notice]);

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

  const onSubmit = async () => {
    if (submitting || lockRemaining > 0) return;
    setFormError(null);
    setBanner(null);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validateSignInPassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    const result = await signIn(normalizeEmail(email), password);
    setSubmitting(false);

    if (!result.ok) {
      setPassword('');
      setFormError(result.message);
      const isCredentialFailure =
        result.message === SIGN_IN_CREDENTIAL_ERROR ||
        result.message === 'Please confirm your email first.';
      if (isCredentialFailure) {
        triggerShake();
        setFailedAttempts((count) => {
          const next = count + 1;
          if (next >= MAX_ATTEMPTS) startLock();
          return next;
        });
      }
      return;
    }

    setPassword('');
    setFailedAttempts(0);
  };

  const locked = lockRemaining > 0;
  const showCreateAccount = formError === SIGN_IN_CREDENTIAL_ERROR;
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
              <Text style={styles.tagline}>Sign in to pick up where you left off.</Text>
            </MotiView>

            <MotiView
              state={shakeState}
              from={reducedMotion ? { opacity: 1 } : { opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={cardTransition}
              style={styles.card}
            >
              <Text style={styles.title}>Sign in</Text>

              {banner ? (
                <View style={styles.banner} accessibilityRole="alert">
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                    style={styles.bannerIcon}
                  />
                  <Text style={styles.bannerText} accessibilityLiveRegion="polite">
                    {banner}
                  </Text>
                </View>
              ) : null}

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
                autoComplete="password"
                textContentType="password"
                maxLength={72}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />

              {formError ? (
                <View style={styles.errorBlock}>
                  <Text
                    style={styles.formError}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {formError}
                  </Text>
                  {showCreateAccount ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Create account"
                      onPress={() =>
                        router.push({
                          pathname: '/(auth)/sign-up',
                          params: email ? { email: normalizeEmail(email) } : undefined,
                        } as never)
                      }
                    >
                      <Text style={styles.createLink}>Create account</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {locked ? (
                <Text style={styles.lockText} accessibilityLiveRegion="polite">
                  Too many attempts. Try again in {lockRemaining}s.
                </Text>
              ) : null}

              <Button
                title={locked ? `Wait ${lockRemaining}s` : 'Sign in'}
                onPress={onSubmit}
                loading={submitting}
                disabled={submitting || locked}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>New to Focusly?</Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Create an account"
                  onPress={() => router.push('/(auth)/sign-up' as never)}
                >
                  <Text style={styles.switchLink}>Create an account</Text>
                </Pressable>
              </View>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerIcon: { marginTop: 1, marginRight: spacing.sm },
  bannerText: { flex: 1, color: colors.success, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  errorBlock: { gap: spacing.sm },
  formError: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  createLink: {
    color: colors.lightViolet,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 44,
    lineHeight: 44,
  },
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
});
