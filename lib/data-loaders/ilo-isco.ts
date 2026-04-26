import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

// Loader for the per-country ISCO-08 1-digit employment envelope produced by
// scripts/data-prep/build_ilo_isco_country.py. Drives the country-demand
// component (s_demand) of the recommendation ranker.

export interface IloIscoSourceRow {
  year: number;
  period: string;          // e.g. "2023" or "2023-Q2"
  value: number;
  frequency: 'A' | 'Q' | 'M';
}

export interface IloIsco1Group {
  latest_year: number;
  latest_value_thousands: number;
  emp_share: number;       // 0..1
  yoy_pct: number | null;
  cagr_3y_pct: number | null;
  source_rows: IloIscoSourceRow[];
}

export interface IloIscoCountry {
  latest_year: number | null;
  by_isco_1: Record<string, IloIsco1Group>;
  source_file: string;
  rows_used?: number;
}

interface IloIscoFile {
  [country: string]: IloIscoCountry;
}

export async function getIloIscoForCountry(
  country: CountryCode,
): Promise<Sourced<IloIscoCountry | null>> {
  const env = await readEnvelope<IloIscoFile>('ilo_isco_country.json');
  return { ...env, value: env.value[country] ?? null };
}

// 4-digit ISCO unit-group code -> 1-digit major group (the leading digit).
// Defined here because it is purely a property of the ISCO-08 hierarchy and
// every loader using major-group employment needs the same projection.
export function isco1FromIscoCode(isco: string): string {
  if (!isco) return '';
  return isco.charAt(0);
}
