// §7.2.2 — TEMPLATE-GENERATED implication sentence for the
// "Where you are heading by 2035" card. No LLM at runtime. Deterministic is
// more valuable than fluent.
//
// The full template rule set lives here in a single file so reviewers can
// see every sentence that can be shown to a user. Strings are lightly
// parameterized with {X}, {Y} placeholders and the sector category.

import type { WittgensteinRow } from '@/lib/data-loaders/wittgenstein';
import { attainmentDelta } from '@/lib/data-loaders/wittgenstein';

export type SectorCategory =
  | 'office_work'
  | 'technical_trade'
  | 'agriculture'
  | 'services'
  | 'ict';

export interface Implication {
  sentence: string;
  current_tertiary_pct: number;
  projected_2035_tertiary_pct: number;
  delta_pp: number;
  rule: string; // name of the template rule used, for /about/limits transparency
}

// Mapping from ISCO-08 1-digit major group to our 5 sector categories.
// Consumed by opportunity cards (later build step) via the ISCO code on the
// JoinedOccupation record.
export function iscoToSectorCategory(isco: string): SectorCategory {
  const major = isco.charAt(0);
  switch (major) {
    case '1': // managers
    case '2': // professionals
      // Programmers / web / IT support are '2512', '2513', '3512' — ict wins
      if (isco.startsWith('251') || isco.startsWith('252') || isco.startsWith('351')) {
        return 'ict';
      }
      return 'office_work';
    case '3': // technicians
      if (isco.startsWith('351') || isco.startsWith('352')) return 'ict';
      return 'office_work';
    case '4': // clerical
      return 'office_work';
    case '5': // service and sales
      return 'services';
    case '6': // skilled agricultural
    case '9': // elementary (heavy agricultural overlap)
      return isco.startsWith('92') || isco.startsWith('6') ? 'agriculture' : 'services';
    case '7': // craft and related trades
      return 'technical_trade';
    case '8': // plant and machine operators
      return 'technical_trade';
    default:
      return 'services';
  }
}

// Rule engine: sector category + delta magnitude -> sentence.
export function buildImplication(
  rows: WittgensteinRow[],
  sector: SectorCategory,
): Implication | null {
  const delta = attainmentDelta(rows);
  if (
    delta.current_tertiary_pct == null ||
    delta.projected_2035_tertiary_pct == null ||
    delta.delta_pp == null
  ) {
    return null;
  }
  const X = delta.current_tertiary_pct;
  const Y = delta.projected_2035_tertiary_pct;
  const deltaPp = delta.delta_pp;

  const growthFast = deltaPp > 10;
  const flat = Math.abs(deltaPp) < 5;

  let sentence: string;
  let rule: string;

  if (flat) {
    sentence = `Education attainment in your cohort is projected to stay near ${X}% through 2035 — the labor market structure for this role remains stable.`;
    rule = 'flat';
  } else if (growthFast && sector === 'office_work') {
    sentence = `By 2035, projected tertiary attainment in your cohort rises from ${X}% to ${Y}% — competition for entry-level office work intensifies.`;
    rule = 'fast_office';
  } else if (growthFast && sector === 'technical_trade') {
    sentence = `By 2035, tertiary attainment in your cohort rises from ${X}% to ${Y}% — but technical trade roles like this remain less crowded by graduates.`;
    rule = 'fast_trade';
  } else if (growthFast && sector === 'ict') {
    sentence = `By 2035, tertiary attainment in your cohort rises from ${X}% to ${Y}% — demand for ICT workers is projected to grow faster than supply in the region.`;
    rule = 'fast_ict';
  } else if (growthFast && sector === 'services') {
    sentence = `By 2035, tertiary attainment in your cohort rises from ${X}% to ${Y}% — service-sector wages may grow but competition increases for formal roles.`;
    rule = 'fast_services';
  } else if (growthFast && sector === 'agriculture') {
    sentence = `By 2035, tertiary attainment rises from ${X}% to ${Y}% — many of your peers will leave agriculture, creating room for those who stay.`;
    rule = 'fast_agri';
  } else {
    // Moderate growth (5-10pp). Neutral sentence, sector name surfaced.
    sentence = `By 2035, tertiary attainment in your cohort moves from ${X}% to ${Y}% — the ${sector.replace('_', ' ')} sector outlook is moderate.`;
    rule = 'moderate';
  }

  return {
    sentence,
    current_tertiary_pct: X,
    projected_2035_tertiary_pct: Y,
    delta_pp: deltaPp,
    rule,
  };
}
