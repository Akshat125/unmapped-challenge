import type { EducationBucketEarnings } from '@/lib/data-loaders/ilostat';

// Returns-to-education — computed as the RATIO of mean earnings across
// education levels WITHIN the same sector (§6.2). Not a controlled regression.
// Confounded by sector self-selection and unobservables; disclosed in
// /about/limits.
//
// Education buckets in the ILOSTAT seed: basic | secondary | tertiary.
// Country-config education ids (SHS, SSC, …) are mapped to these buckets
// via educationIdToBucket() below so the same data feeds both views.
export type EducationBucket = 'basic' | 'secondary' | 'tertiary';

export function educationIdToBucket(id: string): EducationBucket | null {
  switch (id) {
    case 'none':
      return 'basic';
    case 'bece':
    case 'ssc':
    case 'kcpe':
    case 'lower_secondary':
    case 'ensino_fundamental':
      return 'basic';
    case 'shs':
    case 'hsc':
    case 'kcse':
    case 'upper_secondary':
    case 'ensino_medio':
      return 'secondary';
    case 'tertiary':
    case 'bachelor':
    case 'superior':
      return 'tertiary';
    default:
      return null;
  }
}

export interface SectorEducationReturn {
  sector: string;
  baseBucket: EducationBucket;
  higherBucket: EducationBucket;
  baseMean: number;
  higherMean: number;
  premiumPct: number; // (higher - base) / base, percentage points in percent units
  currency: string;
}

// Wage premium for the higher education bucket over the base bucket, within
// a sector. Returns null if either bucket is missing for that sector.
export function computePremium(
  rows: EducationBucketEarnings[],
  sector: string,
  baseBucket: EducationBucket,
  higherBucket: EducationBucket,
): SectorEducationReturn | null {
  const base = rows.find((r) => r.sector === sector && r.education === baseBucket);
  const higher = rows.find((r) => r.sector === sector && r.education === higherBucket);
  if (!base || !higher || base.mean_monthly <= 0) return null;
  const premiumPct =
    Math.round(((higher.mean_monthly - base.mean_monthly) / base.mean_monthly) * 1000) / 10;
  return {
    sector,
    baseBucket,
    higherBucket,
    baseMean: base.mean_monthly,
    higherMean: higher.mean_monthly,
    premiumPct,
    currency: base.currency,
  };
}

// Convenience: the tertiary-over-secondary premium — the most common signal
// shown on opportunity cards ("Wage premium for tertiary over secondary: +58%").
export function tertiaryPremium(
  rows: EducationBucketEarnings[],
  sector: string,
): SectorEducationReturn | null {
  return computePremium(rows, sector, 'secondary', 'tertiary');
}
