// §7.1.1 — recommendation ranker.
//
// Score is a transparent linear blend of three normalized sub-scores. There
// are no embeddings, no learned ranker, no black-box similarity — every
// component is a number you can produce on a napkin:
//
//   score = w_demand  * s_demand
//         + w_skill   * s_skill
//         + w_safety  * s_safety
//
// Weights are locked at:
//   w_demand = 0.50  (country employment share + 3y CAGR; ILO 1-digit ISCO)
//   w_skill  = 0.35  (ESCO essentialSkills overlap, debiased for short lists)
//   w_safety = 0.15  (1 − Frey-Osborne near-term displacement risk)
//
// Each sub-score returns its own `EvidenceCitation[]` so the API layer can
// surface "based on what references in the docs we made this recommendation"
// with concrete file paths, rows, and values — see EvidenceCitation below.
import type { EscoOccupation, EscoSkill } from '@/lib/data-loaders/esco';
import type { IloIscoCountry } from '@/lib/data-loaders/ilo-isco';
import { isco1FromIscoCode } from '@/lib/data-loaders/ilo-isco';
import type { FreyOsborneIscoMap } from '@/lib/data-loaders/frey-osborne';
import type { CountryConfig } from '@/lib/config/countries';
import {
  calibrateRisk,
  type RiskBreakdown,
  type CalibrateOptions,
} from '@/lib/risk-calibration';

// ── Locked weights ────────────────────────────────────────────────────────
export const RANK_WEIGHTS = {
  demand: 0.5,
  skill: 0.35,
  safety: 0.15,
} as const;

// ── Skill-overlap debias parameters ───────────────────────────────────────
// The previous count-based ratio penalized denser occupations (5 of 12
// scored worse than 2 of 3). The blended formula:
//   s_skill = α * (matched / total) + (1 - α) * min(1, matched / k)
// keeps the human-readable "N of M" denominator while rewarding absolute
// breadth up to k matches. α=0.5, k=5 — cited in the API source_trace.
const SKILL_ALPHA = 0.5;
const SKILL_ABS_CAP = 5;

// CAGR rescale: a 0% growth reads as 0.5; a +10% YoY reads as 1.0; a -10%
// reads as 0.0. Keeps the demand score bounded without throwing away signal.
const CAGR_RESCALE_BAND_PCT = 10;

// ── Citation shape — emitted to the API and the youth card UI ─────────────
export type EvidenceComponent = 'demand' | 'skill' | 'safety';

export interface EvidenceCitation {
  component: EvidenceComponent;
  // Contribution to the FINAL score, in the same 0..1 scale as `score.total`.
  // Sum of all citations' weighted_contribution ≤ 1.0 (== score.total when
  // every component fired; less when a fallback was used).
  weighted_contribution: number;
  // Raw sub-score before weighting (0..1).
  sub_score: number;
  // Fixed ranker weight that was applied (0..1).
  weight: number;
  source: string;          // human label, displayed in the UI
  source_file: string;     // committed file path, e.g. "data/ilo_emp_occ_VNM.csv"
  detail: string;          // sentence-form explanation
  values: Record<string, number | string | null>;
}

export interface SubScore {
  value: number;
  citation: EvidenceCitation;
}

export interface SkillMatch {
  occupation: EscoOccupation;
  // Legacy "N of M" overlap surfacing — preserved on the card unchanged.
  matchedUris: string[];
  missingUris: string[];
  missingLabels: string[];
  matched: number;
  total: number;
  ratio: number;
  // Sub-scores + weighted total (new)
  score: {
    demand: number;
    skill: number;
    safety: number;
    total: number;
  };
  citations: EvidenceCitation[];
  // Pre-computed automation risk breakdown so the API doesn't recompute it.
  risk: RiskBreakdown;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function rescaleCagr(cagrPct: number | null): number {
  if (cagrPct == null) return 0.5; // missing data → neutral
  const clamped = Math.max(-CAGR_RESCALE_BAND_PCT, Math.min(CAGR_RESCALE_BAND_PCT, cagrPct));
  return (clamped + CAGR_RESCALE_BAND_PCT) / (2 * CAGR_RESCALE_BAND_PCT);
}

// ── Sub-score: skill overlap (ESCO essentialSkills) ───────────────────────

function scoreSkill(
  occupation: EscoOccupation,
  profileSkillUris: string[],
  labelByUri: Map<string, string>,
): { value: number; matched: number; total: number; matchedUris: string[]; missingUris: string[]; missingLabels: string[]; citation: EvidenceCitation } {
  const profileSet = new Set(profileSkillUris);
  const matchedUris: string[] = [];
  const missingUris: string[] = [];
  for (const uri of occupation.essential_skills) {
    if (profileSet.has(uri)) matchedUris.push(uri);
    else missingUris.push(uri);
  }
  const matched = matchedUris.length;
  const total = occupation.essential_skills.length;
  const ratio = total === 0 ? 0 : matched / total;
  const absScore = Math.min(1, matched / SKILL_ABS_CAP);
  const sub = SKILL_ALPHA * ratio + (1 - SKILL_ALPHA) * absScore;

  const missingLabels = missingUris.map((u) => labelByUri.get(u) ?? u);
  const matchedLabels = matchedUris.map((u) => labelByUri.get(u) ?? u);

  const detail =
    total === 0
      ? 'This occupation has no listed essential skills, so the overlap component is neutral.'
      : `${matched} of ${total} essential ESCO skills matched. Skill score blends coverage ratio (${(ratio * 100).toFixed(0)}%) with absolute breadth (${matched} of up to ${SKILL_ABS_CAP}).`;

  return {
    value: sub,
    matched,
    total,
    matchedUris,
    missingUris,
    missingLabels,
    citation: {
      component: 'skill',
      sub_score: sub,
      weight: RANK_WEIGHTS.skill,
      weighted_contribution: sub * RANK_WEIGHTS.skill,
      source: 'ESCO v1.2.1 essentialSkills',
      source_file: 'public/data/esco_occupations.json',
      detail,
      values: {
        matched,
        total,
        coverage_ratio: Number(ratio.toFixed(3)),
        absolute_score: Number(absScore.toFixed(3)),
        first_three_matched: matchedLabels.slice(0, 3).join('; '),
      },
    },
  };
}

// ── Sub-score: country demand (ILO ISCO 1-digit) ──────────────────────────

function scoreDemand(
  occupation: EscoOccupation,
  ilo: IloIscoCountry | null,
  iloSourceLabel: string,
): SubScore {
  const isco1 = isco1FromIscoCode(occupation.isco_code);
  const group = ilo?.by_isco_1?.[isco1];

  if (!group) {
    return {
      value: 0.5,
      citation: {
        component: 'demand',
        sub_score: 0.5,
        weight: RANK_WEIGHTS.demand,
        weighted_contribution: 0.5 * RANK_WEIGHTS.demand,
        source: iloSourceLabel,
        source_file: ilo?.source_file ?? 'data/ilo_emp_occ_*.csv',
        detail: `No ILO data for ISCO-08 major group ${isco1 || '?'} in this country — demand component is neutral.`,
        values: { isco_1: isco1, emp_share: null, cagr_3y_pct: null, latest_year: null },
      },
    };
  }

  // Two halves: cap emp_share at 0.30 (rescale to 1.0) so a single dominant
  // group doesn't crowd out everything else; CAGR rescaled into [0,1].
  const empShareScaled = Math.min(1, group.emp_share / 0.3);
  const cagrScaled = rescaleCagr(group.cagr_3y_pct);
  const sub = 0.5 * empShareScaled + 0.5 * cagrScaled;

  const cagrText = group.cagr_3y_pct != null ? `${group.cagr_3y_pct.toFixed(1)}%/yr` : 'unavailable';
  const yoyText = group.yoy_pct != null ? `${group.yoy_pct.toFixed(1)}%` : 'unavailable';
  const periodsCited = group.source_rows
    .slice(0, 4)
    .map((r) => r.period)
    .join(', ');

  return {
    value: sub,
    citation: {
      component: 'demand',
      sub_score: sub,
      weight: RANK_WEIGHTS.demand,
      weighted_contribution: sub * RANK_WEIGHTS.demand,
      source: iloSourceLabel,
      source_file: ilo?.source_file ?? 'data/ilo_emp_occ_*.csv',
      detail: `ISCO-08 major group ${isco1} represents ${(group.emp_share * 100).toFixed(1)}% of ${ilo?.latest_year ?? 'recent'} employment, with a 3-year CAGR of ${cagrText} (last YoY ${yoyText}). Rows used: ${periodsCited}.`,
      values: {
        isco_1: isco1,
        emp_share: Number((group.emp_share * 100).toFixed(2)),
        cagr_3y_pct: group.cagr_3y_pct,
        yoy_pct: group.yoy_pct,
        latest_year: group.latest_year,
        latest_value_thousands: group.latest_value_thousands,
      },
    },
  };
}

// ── Sub-score: automation safety (Frey-Osborne, country-calibrated) ───────

function scoreSafety(
  occupation: EscoOccupation,
  fowOverlay: FreyOsborneIscoMap,
  fowOverlaySource: string,
  country: CountryConfig,
  riskOpts: CalibrateOptions,
): { value: number; citation: EvidenceCitation; risk: RiskBreakdown } {
  // Prefer the overlay (employment-weighted SOC→ISCO from frey_osborne.csv).
  // Fall back to whatever value was baked into esco_occupations.json so cards
  // still rank deterministically when the crosswalk is sparse.
  const overlay = fowOverlay[occupation.isco_code];
  const fallbackRaw = occupation.frey_osborne_raw ?? 0;
  const foRaw = overlay ? overlay.fo_prob : fallbackRaw;

  const breakdown = calibrateRisk(foRaw, country, riskOpts);
  const sub = 1 - breakdown.near_term_displacement_risk;

  let detail: string;
  let citationSource: string;
  let citationFile: string;
  const values: Record<string, number | string | null> = {
    fo_prob: Number(foRaw.toFixed(3)),
    near_term_risk_pct: Math.round(breakdown.near_term_displacement_risk * 100),
    long_term_risk_pct: Math.round(breakdown.long_term_risk * 100),
    broadband_pct: country.broadbandPenetration,
    routine_share: Number(breakdown.inputs.ilo_routine_task_share.toFixed(2)),
  };

  if (overlay) {
    const topSocs = overlay.sources.slice(0, 3).map((s) => s.soc).join(', ');
    detail = `Frey-Osborne probability ${foRaw.toFixed(2)} (employment-weighted across ${overlay.n_socs} SOC code${overlay.n_socs === 1 ? '' : 's'}: ${topSocs}${overlay.n_socs > 3 ? '…' : ''}). Calibrated for ${country.name} broadband ${country.broadbandPenetration}% × routine-task share ${breakdown.inputs.ilo_routine_task_share.toFixed(2)} → near-term local risk ${Math.round(breakdown.near_term_displacement_risk * 100)}%; safety = 1 − risk.`;
    citationSource = fowOverlaySource;
    citationFile = 'data/frey_osborne.csv';
    values.n_socs = overlay.n_socs;
    values.top_socs = topSocs;
  } else if (fallbackRaw > 0) {
    detail = `Frey-Osborne probability ${foRaw.toFixed(2)} (legacy ISCO-keyed seed; SOC crosswalk had no entry for ISCO ${occupation.isco_code}). Calibrated for ${country.name} broadband ${country.broadbandPenetration}% × routine-task share ${breakdown.inputs.ilo_routine_task_share.toFixed(2)} → near-term local risk ${Math.round(breakdown.near_term_displacement_risk * 100)}%; safety = 1 − risk.`;
    citationSource = 'Frey & Osborne (2013) · ISCO-keyed seed';
    citationFile = 'public/data/esco_occupations.json (frey_osborne_raw)';
    values.fallback = 'esco_occupations.frey_osborne_raw';
  } else {
    detail = `No Frey-Osborne probability available for ISCO ${occupation.isco_code}. Safety component falls back to country routine-task share (${country.routineTaskShare}) — partial signal only.`;
    citationSource = `Country routine-task share (${country.code})`;
    citationFile = 'lib/config/countries.ts';
    values.fallback = 'country_routine_task_share';
  }

  return {
    value: sub,
    risk: breakdown,
    citation: {
      component: 'safety',
      sub_score: sub,
      weight: RANK_WEIGHTS.safety,
      weighted_contribution: sub * RANK_WEIGHTS.safety,
      source: citationSource,
      source_file: citationFile,
      detail,
      values,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────

export interface RankInputs {
  profileSkillUris: string[];
  allSkills: EscoSkill[];
  ilo: IloIscoCountry | null;
  iloSourceLabel: string;
  fowOverlay: FreyOsborneIscoMap;
  fowOverlaySource: string;
  country: CountryConfig;
  riskOpts: (occupation: EscoOccupation) => CalibrateOptions;
}

export function matchSkills(
  occupation: EscoOccupation,
  inputs: RankInputs,
  labelByUri: Map<string, string>,
): SkillMatch {
  const skill = scoreSkill(occupation, inputs.profileSkillUris, labelByUri);
  const demand = scoreDemand(occupation, inputs.ilo, inputs.iloSourceLabel);
  const safety = scoreSafety(
    occupation,
    inputs.fowOverlay,
    inputs.fowOverlaySource,
    inputs.country,
    inputs.riskOpts(occupation),
  );

  const total =
    RANK_WEIGHTS.demand * demand.value +
    RANK_WEIGHTS.skill * skill.value +
    RANK_WEIGHTS.safety * safety.value;

  return {
    occupation,
    matchedUris: skill.matchedUris,
    missingUris: skill.missingUris,
    missingLabels: skill.missingLabels,
    matched: skill.matched,
    total: skill.total,
    ratio: skill.total === 0 ? 0 : skill.matched / skill.total,
    score: {
      demand: demand.value,
      skill: skill.value,
      safety: safety.value,
      total,
    },
    citations: [demand.citation, skill.citation, safety.citation],
    risk: safety.risk,
  };
}

export function rankMatches(
  occupations: EscoOccupation[],
  inputs: RankInputs,
): SkillMatch[] {
  const labelByUri = new Map(inputs.allSkills.map((s) => [s.uri, s.label]));
  return occupations
    .map((occ) => matchSkills(occ, inputs, labelByUri))
    .sort((a, b) => b.score.total - a.score.total || b.matched - a.matched);
}
