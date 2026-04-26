import { US_ROUTINE_TASK_SHARE, type CountryConfig } from '@/lib/config/countries';

// Risk calibration implements TWO formulas that answer different questions:
//
//   (A) §6.4 — near-term displacement risk (speed-of-arrival framing)
//       near_term = frey_osborne_raw × infrastructure_factor × task_composition_factor
//       infrastructure_factor = 0.3 + 0.7 × (broadband / 100)
//       task_composition_factor = local_routine_share / us_routine_share
//       Answers: "when does the risk arrive here, given local infra + tasks?"
//
//   (B) §V3.0 final risk (econometric rigor)
//       Final_Risk = (fo_raw × infrastructure_delay_factor)
//                  + (1 − skill_complexity_score)
//       Answers: "what's the net exposure once we account for how hard the
//       occupation's task mix is to automate?"
//
// Both are surfaced in the breakdown so the tooltip can show both. The
// near-term number drives the youth-facing speed-of-arrival narrative;
// Final_Risk drives the policymaker Command Center.

export type RoutineShareSource = 'ilo_fow_per_occupation' | 'country_constant';

export interface RiskBreakdown {
  long_term_risk: number;                // Frey-Osborne raw, unchanged
  near_term_displacement_risk: number;   // formula A, clamped [0,1]
  final_risk_v3: number;                 // formula B, clamped [0,1]
  infrastructure_factor: number;         // formula A
  infrastructure_delay_factor: number;   // formula B — slows arrival as infra thins
  task_composition_factor: number;       // formula A
  skill_complexity_score: number;        // formula B — 0..1 (higher = more protected)
  inputs: {
    frey_osborne_raw: number;
    mobile_broadband_penetration: number;
    ilo_routine_task_share: number;
    us_routine_task_share: number;
    cognitive_share: number;
    manual_share: number;
    routine_share_source: RoutineShareSource;
  };
}

export interface CalibrateOptions {
  occupationRoutineShare?: number;    // from ILO FoW
  cognitiveShare?: number;            // from ILO FoW
  manualShare?: number;               // from ILO FoW
  usRoutineWeightedMean?: number;
}

// Skill complexity = share of non-routine tasks, gently rewarded for
// cognitive intensity. Clamped [0,1]. Formula is deliberately simple so the
// Value is easy to defend in Q&A:
//   complexity = (1 − routine_share) × (0.6 + 0.4 × cognitive_share)
export function skillComplexityScore(
  routineShare: number,
  cognitiveShare: number,
): number {
  const nonRoutine = Math.max(0, Math.min(1, 1 - routineShare));
  const cogBoost = 0.6 + 0.4 * Math.max(0, Math.min(1, cognitiveShare));
  return Math.max(0, Math.min(1, nonRoutine * cogBoost));
}

// Infrastructure delay factor = how much local infra SLOWS the arrival of
// automation. Low broadband → low delay factor → risk doesn't arrive yet.
// Shares the (0.3 + 0.7 × p) shape with formula A's infrastructure_factor
// so the two stay numerically comparable.
export function infrastructureDelayFactor(broadbandPct: number): number {
  return 0.3 + 0.7 * (Math.max(0, Math.min(100, broadbandPct)) / 100);
}

export function calibrateRisk(
  freyOsborneRaw: number,
  country: CountryConfig,
  opts: CalibrateOptions = {},
): RiskBreakdown {
  const infrastructure_factor = infrastructureDelayFactor(country.broadbandPenetration);
  const infrastructure_delay_factor = infrastructure_factor; // same shape

  const routineShare = opts.occupationRoutineShare ?? country.routineTaskShare;
  const cognitiveShare = opts.cognitiveShare ?? 1 - routineShare; // conservative
  const manualShare = opts.manualShare ?? routineShare;
  const usRoutineShare = opts.usRoutineWeightedMean ?? US_ROUTINE_TASK_SHARE;
  const source: RoutineShareSource =
    opts.occupationRoutineShare != null ? 'ilo_fow_per_occupation' : 'country_constant';

  const task_composition_factor = routineShare / usRoutineShare;
  const skill_complexity_score = skillComplexityScore(routineShare, cognitiveShare);

  const near_term_raw = freyOsborneRaw * infrastructure_factor * task_composition_factor;
  const near_term_displacement_risk = Math.min(1, Math.max(0, near_term_raw));

  // Formula B (V3.0 §2B + rule #2):
  //   Final_Risk = (Global_Automation_Score × Connectivity_Index)
  //              + (1 − Skill_Durability)
  // The sum is divided by its theoretical max (2.0) so it still reads
  // as 0..1 on the UI, which is what the policymaker KPI card expects;
  // the raw unclamped value is also surfaced for power users.
  const final_raw =
    freyOsborneRaw * infrastructure_delay_factor + (1 - skill_complexity_score);
  const final_risk_v3 = Math.min(1, Math.max(0, final_raw / 2));

  return {
    long_term_risk: freyOsborneRaw,
    near_term_displacement_risk,
    final_risk_v3,
    infrastructure_factor,
    infrastructure_delay_factor,
    task_composition_factor,
    skill_complexity_score,
    inputs: {
      frey_osborne_raw: freyOsborneRaw,
      mobile_broadband_penetration: country.broadbandPenetration,
      ilo_routine_task_share: routineShare,
      us_routine_task_share: usRoutineShare,
      cognitive_share: cognitiveShare,
      manual_share: manualShare,
      routine_share_source: source,
    },
  };
}
