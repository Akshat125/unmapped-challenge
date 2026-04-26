import { readEnvelope } from './_read';
import type { CountryCode, Sourced } from './types';

export interface EmploymentRow {
  sector: string;
  year: number;
  employment_thousands: number;
}

export interface SectorEarnings {
  currency: string;
  mean_monthly: number;
  year: number;
}

export interface EducationBucketEarnings {
  sector: string;
  education: 'basic' | 'secondary' | 'tertiary';
  mean_monthly: number;
  currency: string;
}

interface EmploymentFile {
  [country: string]: EmploymentRow[];
}

interface EarningsFile {
  by_sector: Record<string, Record<string, SectorEarnings>>;
  by_sector_and_education: Record<string, EducationBucketEarnings[]>;
}

export async function getEmployment(
  country: CountryCode,
): Promise<Sourced<EmploymentRow[]>> {
  const env = await readEnvelope<EmploymentFile>('ilostat_employment.json');
  return { ...env, value: env.value[country] ?? [] };
}

export async function getEarningsBySector(
  country: CountryCode,
): Promise<Sourced<Record<string, SectorEarnings>>> {
  const env = await readEnvelope<EarningsFile>('ilostat_earnings.json');
  return { ...env, value: env.value.by_sector[country] ?? {} };
}

export async function getEarningsByEducation(
  country: CountryCode,
): Promise<Sourced<EducationBucketEarnings[]>> {
  const env = await readEnvelope<EarningsFile>('ilostat_earnings.json');
  return { ...env, value: env.value.by_sector_and_education[country] ?? [] };
}

// YoY employment growth for the latest year in the series, for a given sector.
export function yoyGrowthPct(rows: EmploymentRow[], sector: string): number | null {
  const series = rows
    .filter((r) => r.sector === sector)
    .sort((a, b) => a.year - b.year);
  if (series.length < 2) return null;
  const prev = series[series.length - 2].employment_thousands;
  const curr = series[series.length - 1].employment_thousands;
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}
