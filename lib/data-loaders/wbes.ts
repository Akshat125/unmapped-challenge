import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

export interface WbesCountry {
  inadequately_educated_workforce_major_constraint_pct: number;
  firms_offering_formal_training_pct: number;
  unfilled_vacancies_pct: number;
  survey_year: number;
}

export async function getWbes(country: CountryCode): Promise<Sourced<WbesCountry | null>> {
  const env = await readEnvelope<Record<string, WbesCountry>>('wbes.json');
  return { ...env, value: env.value[country] ?? null };
}
