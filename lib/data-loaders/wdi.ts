import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

export interface WdiIndicator {
  value: number;
  year: number;
  indicator: string;
}

export interface WdiCountry {
  gdp_per_capita_usd: WdiIndicator;
  labor_force_participation_pct: WdiIndicator;
  employment_to_population_pct: WdiIndicator;
  youth_neet_pct: WdiIndicator;
}

export async function getWdi(country: CountryCode): Promise<Sourced<WdiCountry | null>> {
  const env = await readEnvelope<Record<string, WdiCountry>>('wdi.json');
  return { ...env, value: env.value[country] ?? null };
}
