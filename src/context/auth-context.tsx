import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfig } from '../lib/supabase';
import { isNetworkError, isRateLimitError, normalizeEmail } from '../utils/validation';

export type AuthResult = { ok: true } | { ok: false; message: string };

export const SIGN_IN_CREDENTIAL_ERROR =
  "We couldn't sign you in. Check your email and password, or create an account if you're new here.";
export const SIGN_UP_CREATED_MESSAGE =
  'Account created successfully. Please sign in to continue.';
export const SIGN_UP_CHECK_INBOX =
  'If this email can be registered, you will receive a confirmation link.';

export type ProfileUpdateInput = {
  display_name: string;
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_NOT_CONFIRMED_ERROR = 'Please confirm your email first.';
const NETWORK_ERROR = 'Check your internet connection and try again.';
const RATE_LIMIT_ERROR = 'Too many attempts. Please wait a moment and try again.';
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const CONFIG_ERROR_PROD = GENERIC_ERROR;

function configMessage(): string {
  if (__DEV__) {
    return 'Supabase configuration is missing or invalid. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env, then restart with --clear.';
  }
  return CONFIG_ERROR_PROD;
}

function hasValidConfig(): boolean {
  return supabaseConfig.hasUrl && supabaseConfig.hasKey;
}

function logAuthDev(
  action: 'signIn' | 'signUp' | 'signOut' | 'updateProfile',
  error: unknown
) {
  if (!__DEV__) return;
  const candidate =
    typeof error === 'object' && error !== null
      ? (error as { status?: unknown; code?: unknown; name?: unknown })
      : {};
  console.log(`[focusly-auth][dev] ${action} error`, {
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    hasUrl: supabaseConfig.hasUrl,
    hasKey: supabaseConfig.hasKey,
    urlLooksValid: supabaseConfig.urlLooksValid,
  });
}

function isEmailNotConfirmed(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === 'email_not_confirmed') return true;
  return typeof candidate.message === 'string'
    ? candidate.message.toLowerCase().includes('email not confirmed')
    : false;
}

function mapSignInError(error: unknown): string {
  logAuthDev('signIn', error);
  if (!hasValidConfig()) return configMessage();
  if (isRateLimitError(error)) return RATE_LIMIT_ERROR;
  if (isNetworkError(error)) return NETWORK_ERROR;
  if (isEmailNotConfirmed(error)) return EMAIL_NOT_CONFIRMED_ERROR;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: string; status?: number };
    if (candidate.code === 'invalid_credentials') return SIGN_IN_CREDENTIAL_ERROR;
    if (candidate.status === 400 && !candidate.code) return SIGN_IN_CREDENTIAL_ERROR;
  }
  return GENERIC_ERROR;
}

function mapSignUpError(error: unknown): string {
  logAuthDev('signUp', error);
  if (!hasValidConfig()) return configMessage();
  if (isRateLimitError(error)) return RATE_LIMIT_ERROR;
  if (isNetworkError(error)) return NETWORK_ERROR;
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: string; message?: string; status?: number };
    if (candidate.code === 'user_already_exists') return SIGN_UP_CHECK_INBOX;
    if (candidate.code === 'email_address_invalid') {
      return 'Enter a valid email address.';
    }
    if (candidate.code === 'weak_password') {
      return 'Choose a stronger password.';
    }
    if (
      candidate.status === 400 ||
      candidate.status === 401 ||
      candidate.status === 403 ||
      candidate.status === 422
    ) {
      // Do not hide actionable config/auth failures behind the neutral success copy.
      if (__DEV__) {
        return `Sign up failed (${candidate.code ?? `status ${candidate.status}`}). Check Supabase Auth settings and .env, then restart with --clear.`;
      }
      return GENERIC_ERROR;
    }
  }
  return GENERIC_ERROR;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const suppressSessionRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const loadInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        if (suppressSessionRef.current) {
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch {
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadInitialSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        // Do not await Supabase calls in this callback; it can deadlock.
        if (!mountedRef.current) return;
        if (suppressSessionRef.current) {
          // Suppress the transient sign-up session so Stack.Protected never switches to Home.
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        if (!hasValidConfig()) return { ok: false, message: configMessage() };
        const { data, error } = await supabase.auth.signUp({
          email: normalizeEmail(email),
          password,
          options: {
            data: {
              display_name: name,
              full_name: name,
            },
          },
        });
        if (error) {
          return { ok: false, message: mapSignUpError(error) };
        }
        // Email confirmation ON: no session is returned.
        if (!data.session) {
          if (__DEV__) {
            console.log('[focusly-auth][dev] signUp ok (no session; confirmation may be required)', {
              hasUser: !!data.user,
            });
          }
          return { ok: true };
        }
        // Confirm email OFF: Supabase may return a session. End it locally and never expose it.
        suppressSessionRef.current = true;
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Local scope avoids server dependency; session suppression still prevents a Home flash.
        } finally {
          setSession(null);
          setUser(null);
          suppressSessionRef.current = false;
        }
        return { ok: true };
      } catch (error) {
        logAuthDev('signUp', error);
        suppressSessionRef.current = false;
        if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
        if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
        return { ok: false, message: GENERIC_ERROR };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!hasValidConfig()) return { ok: false, message: configMessage() };
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) {
        return { ok: false, message: mapSignInError(error) };
      }
      return { ok: true };
    } catch (error) {
      logAuthDev('signIn', error);
      if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
      if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
      return { ok: false, message: GENERIC_ERROR };
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logAuthDev('signOut', error);
        if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
        if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
        return { ok: false, message: GENERIC_ERROR };
      }
      setSession(null);
      setUser(null);
      return { ok: true };
    } catch (error) {
      logAuthDev('signOut', error);
      setSession(null);
      setUser(null);
      if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
      if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
      return { ok: false, message: GENERIC_ERROR };
    }
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileUpdateInput): Promise<AuthResult> => {
      try {
        if (!hasValidConfig()) return { ok: false, message: configMessage() };
        const data: Record<string, string> = {
          display_name: input.display_name,
          full_name: input.full_name,
        };
        if (input.phone) data.phone = input.phone;
        else data.phone = '';
        if (input.gender) data.gender = input.gender;
        else data.gender = '';
        if (input.dob) data.dob = input.dob;
        else data.dob = '';

        const { data: result, error } = await supabase.auth.updateUser({ data });
        if (error) {
          logAuthDev('updateProfile', error);
          if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
          if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
          return { ok: false, message: GENERIC_ERROR };
        }
        // Refresh auth state immediately; onAuthStateChange(USER_UPDATED) also applies (set state only).
        if (result.user) setUser(result.user);
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            setSession(sessionData.session);
            if (sessionData.session.user) setUser(sessionData.session.user);
          }
        } catch {
          // updateUser already succeeded; local user state was set above.
        }
        return { ok: true };
      } catch (error) {
        logAuthDev('updateProfile', error);
        if (isRateLimitError(error)) return { ok: false, message: RATE_LIMIT_ERROR };
        if (isNetworkError(error)) return { ok: false, message: NETWORK_ERROR };
        return { ok: false, message: GENERIC_ERROR };
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, loading, signUp, signIn, signOut, updateProfile }),
    [session, user, loading, signUp, signIn, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
