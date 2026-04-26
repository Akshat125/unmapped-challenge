import type { RiskBreakdown } from '@/lib/risk-calibration';

// Build a plain-language sentence describing automation outlook for a
// specific occupation in a specific country. No percentages, no formulas.
// The Youth surface shows this sentence by default; the numeric breakdown
// + formula live behind a disclosure.
//
// The sentence has two pieces:
//   1. Pressure level narrative (low / moderate / high / very high)
//   2. Durable-skills hint drawn from cognitive share

export interface RiskNarrative {
  headline: string;
  sentence: string;
  level: 'low' | 'moderate' | 'high' | 'very_high';
}

export function buildRiskNarrative(
  breakdown: RiskBreakdown,
  countryName: string,
): RiskNarrative {
  const local = breakdown.near_term_displacement_risk;
  const cognitiveShare = breakdown.inputs.cognitive_share;

  let level: RiskNarrative['level'];
  let pressureWord: string;
  if (local < 0.3) {
    level = 'low';
    pressureWord = 'low';
  } else if (local < 0.55) {
    level = 'moderate';
    pressureWord = 'moderate';
  } else if (local < 0.8) {
    level = 'high';
    pressureWord = 'meaningful';
  } else {
    level = 'very_high';
    pressureWord = 'heavy';
  }

  const whereCognitiveIsDurable = cognitiveShare > 0.55;
  const durableHint = whereCognitiveIsDurable
    ? 'The skills that protect you are the ones that take judgment — conversations with customers, diagnosing tricky problems, adapting when things go wrong.'
    : 'The skills that protect you are the hands-on, judgment-heavy parts of this work — the moments a machine still needs a person.';

  const headline =
    level === 'low'
      ? `This role faces low automation pressure in ${countryName}.`
      : level === 'moderate'
        ? `This role faces ${pressureWord} automation pressure in ${countryName} — mostly in the routine parts.`
        : level === 'high'
          ? `This role faces ${pressureWord} automation pressure in ${countryName}.`
          : `This role faces ${pressureWord} automation pressure in ${countryName} over the next years.`;

  return {
    level,
    headline,
    sentence: `${headline} ${durableHint}`,
  };
}
