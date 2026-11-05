import type { User } from '@supabase/supabase-js';

export type GenderValue = '' | 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type ProfileFields = {
  phone: string;
  gender: GenderValue;
  dob: string;
};

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function meta(user: User | null | undefined): Record<string, unknown> {
  // Metadata is user-editable; read it only for display/profile details, never for authorization.
  return (user?.user_metadata ?? {}) as Record<string, unknown>;
}

export function getDisplayName(user: User | null | undefined): string {
  const m = meta(user);
  const raw =
    typeof m.display_name === 'string' && m.display_name.trim()
      ? m.display_name.trim().replace(/\s+/g, ' ')
      : typeof m.full_name === 'string' && m.full_name.trim()
        ? m.full_name.trim().replace(/\s+/g, ' ')
        : '';
  if (raw) return raw;

  const email = typeof user?.email === 'string' ? user.email : '';
  const local = email.split('@')[0]?.trim();
  if (local) return capitalize(local);
  return 'there';
}

export function getFirstName(user: User | null | undefined): string {
  return getDisplayName(user).split(/\s+/)[0] || 'there';
}

export function getInitials(user: User | null | undefined): string {
  const name = getDisplayName(user);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const email = typeof user?.email === 'string' ? user.email.trim() : '';
  return (email[0] ?? '?').toUpperCase();
}

export function getProfileFields(user: User | null | undefined): ProfileFields {
  const m = meta(user);
  const phone = typeof m.phone === 'string' ? m.phone : '';
  const genderRaw = typeof m.gender === 'string' ? m.gender : '';
  const gender: GenderValue =
    genderRaw === 'male' ||
    genderRaw === 'female' ||
    genderRaw === 'other' ||
    genderRaw === 'prefer_not_to_say'
      ? genderRaw
      : '';
  const dob = typeof m.dob === 'string' ? m.dob : '';
  return { phone, gender, dob };
}
