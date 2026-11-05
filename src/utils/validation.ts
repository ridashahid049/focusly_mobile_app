export type PasswordStrength = 'weak' | 'fair' | 'strong';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateName(value: string): string | null {
  const name = normalizeName(value);
  if (!name) return 'Enter your full name.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > 50) return 'Name must be 50 characters or fewer.';
  if (!/^[\p{L}\p{M}]+(?:[ '\u2019.-]*[\p{L}\p{M}]+)*\.?$/u.test(name)) {
    return 'Use letters, spaces, apostrophes, hyphens, or dots only.';
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Enter your email address.';
  if (email.length > 254) return 'Email address is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Enter your password.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 72) return 'Password must be 72 characters or fewer.';
  if (!/[a-z]/.test(value)) return 'Add a lowercase letter.';
  if (!/[A-Z]/.test(value)) return 'Add an uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Add a number.';
  return null;
}

export function validateSignInPassword(value: string): string | null {
  if (!value) return 'Enter your password.';
  if (value.length > 72) return 'Password must be 72 characters or fewer.';
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return 'Confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  return 'strong';
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validatePhone(value: string): string | null {
  const phone = normalizePhone(value);
  if (!phone) return null;
  if (phone.length > 20) return 'Phone number is too long.';
  if (!/^[+\d\s().-]+$/.test(phone)) {
    return 'Use only digits, spaces, +, -, or parentheses.';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Enter a phone number with 7 to 15 digits.';
  }
  return null;
}

export function normalizeDob(value: string): string {
  return value.trim();
}

export function validateDob(value: string, todayKey: string): string | null {
  const dob = normalizeDob(value);
  if (!dob) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return 'Use the format YYYY-MM-DD.';
  }
  const [y, m, d] = dob.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const isReal =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  if (!isReal) return 'Enter a real date.';
  if (y < 1900) return 'Enter a year of 1900 or later.';
  if (dob > todayKey) return 'Date of birth cannot be in the future.';
  return null;
}

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
}

export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { status?: number; code?: string; message?: string };
  if (candidate.status === 429) return true;
  if (candidate.code === 'over_request_rate_limit') return true;
  return typeof candidate.message === 'string'
    ? candidate.message.toLowerCase().includes('rate limit')
    : false;
}
