import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

export interface WittgensteinRow {
  year: number;
  no_education_pct: number;
  basic_pct: number;
  secondary_pct: number;
  tertiary_pct: number;
}

export async function getWittgenstein(
  country: CountryCode,
): Promise<Sourced<WittgensteinRow[]>> {
  const env = await readEnvelope<Record<string, WittgensteinRow[]>>('wittgenstein.json');
  return { ...env, value: env.value[country] ?? [] };
}

// Convenience helper consumed by wittgenstein-implications.ts (future).
export function attainmentDelta(rows: WittgensteinRow[]): {
  current_tertiary_pct: number | null;
  projected_2035_tertiary_pct: number | null;
  delta_pp: number | null;
} {
  if (rows.length === 0) {
    return { current_tertiary_pct: null, projected_2035_tertiary_pct: null, delta_pp: null };
  }
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  const earliest = sorted[0].tertiary_pct;
  const target2035 = sorted.find((r) => r.year === 2035)?.tertiary_pct
    ?? sorted[sorted.length - 1].tertiary_pct;
  return {
    current_tertiary_pct: earliest,
    projected_2035_tertiary_pct: target2035,
    delta_pp: target2035 - earliest,
  };
}
