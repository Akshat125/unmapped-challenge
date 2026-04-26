'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/lib/profile-store';

// Client hook that pulls the aggregate payload for the active country.
// Shared across all /policymaker/* pages to avoid duplicated fetches.
export interface AggregateResponse {
  country: string;
  country_name: string;
  currency_label: string;
  broadband_penetration_pct: number;
  sources: Record<string, string>;
  sectors: Array<{
    sector: string;
    employment_thousands_latest: number | null;
    employment_thousands_prev: number | null;
    series: Array<{ sector: string; year: number; employment_thousands: number }>;
    yoy_growth_pct: number | null;
    wage: { currency: string; mean_monthly: number; year: number } | null;
    premium: {
      sector: string;
      baseBucket: string;
      higherBucket: string;
      premiumPct: number;
      baseMean: number;
      higherMean: number;
      currency: string;
    } | null;
  }>;
  occupation_risks: Array<{
    isco_code: string;
    preferred_label: string;
    long_term_risk: number;
    near_term_risk: number;
    final_risk_v3: number;
    skill_complexity_score: number;
    routine_share: number;
    routine_share_source: 'ilo_fow_per_occupation' | 'country_constant';
  }>;
  wbes: {
    inadequately_educated_workforce_major_constraint_pct: number;
    firms_offering_formal_training_pct: number;
    unfilled_vacancies_pct: number;
    survey_year: number;
  } | null;
  wdi: {
    gdp_per_capita_usd: { value: number; year: number; indicator: string };
    labor_force_participation_pct: { value: number; year: number; indicator: string };
    employment_to_population_pct: { value: number; year: number; indicator: string };
    youth_neet_pct: { value: number; year: number; indicator: string };
  } | null;
  wittgenstein: {
    rows: Array<{
      year: number;
      no_education_pct: number;
      basic_pct: number;
      secondary_pct: number;
      tertiary_pct: number;
    }>;
    attainment: {
      current_tertiary_pct: number | null;
      projected_2035_tertiary_pct: number | null;
      delta_pp: number | null;
    };
  };
  kpis: {
    skill_divergence: {
      index: number;
      current: {
        year: number;
        no_education_pct: number;
        basic_pct: number;
        secondary_pct: number;
        tertiary_pct: number;
      } | null;
      target: {
        year: number;
        no_education_pct: number;
        basic_pct: number;
        secondary_pct: number;
        tertiary_pct: number;
      } | null;
    };
    automation_hotspots: Array<{
      sector: string;
      routine_density: number;
      employment_thousands_latest: number;
      contributing_occupations: number;
    }>;
    roi_on_training: Array<{
      sector: string;
      wage_uplift_pct: number;
      skill_point_delta: number;
      roi_per_skill_point: number;
      currency: string;
    }>;
  };
}

export function useAggregate(): {
  data: AggregateResponse | null;
  loading: boolean;
  error: string | null;
} {
  const country = useProfile((s) => s.country);
  const [data, setData] = useState<AggregateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/policymaker/aggregate?country=${country}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(String(r.status))))
      .then((body) => !cancelled && setData(body))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [country]);

  return { data, loading, error };
}
