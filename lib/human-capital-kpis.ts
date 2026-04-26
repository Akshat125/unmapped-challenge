// KPIs for the Policymaker Command Center (V3.0 §3 Group 4).
// Pure functions so they can be recomputed client-side when weights change.

import type { WittgensteinRow } from '@/lib/data-loaders/wittgenstein';
import type { TaskContent } from '@/lib/data-loaders/ilo-fow';

// ---- Skill Divergence Index ---------------------------------------------
// Gap between the education mix of the current 20-24 cohort and a "target
// mix" for 2030, where the target mix is taken from the Wittgenstein 2035
// projection for that cohort. Sum of absolute percentage-point differences
// across attainment levels, divided by 2 so it reports 0..1.
export function skillDivergenceIndex(rows: WittgensteinRow[]): {
  index: number;
  current: WittgensteinRow | null;
  target: WittgensteinRow | null;
} {
  if (!rows.length) return { index: 0, current: null, target: null };
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  const current = sorted[0];
  const target =
    sorted.find((r) => r.year === 2030) ?? sorted[sorted.length - 1];
  if (!current || !target) return { index: 0, current, target };
  const buckets: Array<keyof WittgensteinRow> = [
    'no_education_pct',
    'basic_pct',
    'secondary_pct',
    'tertiary_pct',
  ];
  const absSum = buckets.reduce(
    (s, k) => s + Math.abs((current[k] as number) - (target[k] as number)),
    0,
  );
  return { index: absSum / 200, current, target };
}

// ---- Automation Hotspots -------------------------------------------------
// Per-sector routine-task density = mean routine_share across mapped
// occupations, weighted by current employment thousands.
export interface HotspotRow {
  sector: string;
  routine_density: number;        // 0..1
  employment_thousands_latest: number;
  contributing_occupations: number;
}

export function automationHotspots(
  sectors: Array<{ sector: string; employment_thousands_latest: number | null }>,
  occupations: Array<{ isco_code: string; sector: string; routine_share: number }>,
): HotspotRow[] {
  return sectors
    .map((s) => {
      const occs = occupations.filter((o) => o.sector === s.sector);
      if (occs.length === 0) {
        return {
          sector: s.sector,
          routine_density: 0,
          employment_thousands_latest: s.employment_thousands_latest ?? 0,
          contributing_occupations: 0,
        };
      }
      const density =
        occs.reduce((sum, o) => sum + o.routine_share, 0) / occs.length;
      return {
        sector: s.sector,
        routine_density: density,
        employment_thousands_latest: s.employment_thousands_latest ?? 0,
        contributing_occupations: occs.length,
      };
    })
    .sort((a, b) => b.routine_density - a.routine_density);
}

// ---- ROI on Training -----------------------------------------------------
// For a sector with a tertiary wage premium, the ROI per "skill point" is
// the wage delta (tertiary − secondary) divided by the rough skill-complexity
// gain moving from routine-heavy to cognitive-heavy roles. We approximate the
// skill-point delta as (1 − sector_routine_density). A 30% wage uplift on a
// sector with routine_density 0.5 yields 30 / (1 − 0.5) = 60 currency units
// per skill point.
export interface RoiRow {
  sector: string;
  wage_uplift_pct: number;
  skill_point_delta: number;
  roi_per_skill_point: number;
  currency: string;
}

export function roiOnTraining(
  sectors: Array<{
    sector: string;
    premium: { premiumPct: number; currency: string } | null;
  }>,
  hotspots: HotspotRow[],
): RoiRow[] {
  const densityBySector = new Map(hotspots.map((h) => [h.sector, h.routine_density]));
  return sectors
    .filter((s) => s.premium)
    .map((s) => {
      const density = densityBySector.get(s.sector) ?? 0.5;
      const skillPointDelta = Math.max(0.1, 1 - density);
      const roi = (s.premium!.premiumPct) / skillPointDelta;
      return {
        sector: s.sector,
        wage_uplift_pct: s.premium!.premiumPct,
        skill_point_delta: skillPointDelta,
        roi_per_skill_point: roi,
        currency: s.premium!.currency,
      };
    })
    .sort((a, b) => b.roi_per_skill_point - a.roi_per_skill_point);
}
