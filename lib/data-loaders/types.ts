import type { CountryCode } from '@/lib/config/countries';

export type { CountryCode };

// Envelope every loader returns so the UI can never omit the source label.
// Matches the JSON envelope written by scripts/data-prep/_common.py:write_output.
export interface Sourced<T> {
  value: T;
  source: string;
  fetchedAt: string;
}

// Wrapper that preserves the source label while adapting value shape.
export function mapSourced<T, U>(s: Sourced<T>, fn: (v: T) => U): Sourced<U> {
  return { value: fn(s.value), source: s.source, fetchedAt: s.fetchedAt };
}
