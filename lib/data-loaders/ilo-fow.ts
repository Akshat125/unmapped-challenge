import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

export interface TaskContent {
  isco_code: string;
  routine_share: number;
  cognitive_share: number;
  manual_share: number;
}

interface FowFile {
  by_isco: TaskContent[];
  country_overrides: Record<string, Record<string, Partial<Omit<TaskContent, 'isco_code'>>>>;
  us_routine_weighted_mean: number;
}

export interface FowResolved {
  byIsco: Map<string, TaskContent>;
  usRoutineWeightedMean: number;
}

// Resolves global task-content + country-specific overrides (when present)
// into a single per-ISCO lookup table. The Sourced envelope preserves the
// ILO label for UI surfacing.
export async function getFowForCountry(
  country: CountryCode,
): Promise<Sourced<FowResolved>> {
  const env = await readEnvelope<FowFile>('ilo_fow_tasks.json');
  const map = new Map<string, TaskContent>();
  for (const row of env.value.by_isco) map.set(row.isco_code, row);

  const overrides = env.value.country_overrides[country] ?? {};
  for (const [isco, patch] of Object.entries(overrides)) {
    const base = map.get(isco);
    if (!base) continue;
    map.set(isco, { ...base, ...patch });
  }

  return {
    ...env,
    value: {
      byIsco: map,
      usRoutineWeightedMean: env.value.us_routine_weighted_mean,
    },
  };
}
