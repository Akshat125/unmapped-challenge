// Resilience gaps — pairs a profile's mapped skills with adjacent durable
// skills (higher cognitive share) worth training toward. Used by the
// navigator's strategic-coaching panel and referenced in /about/limits.

import type { EscoSkill } from '@/lib/data-loaders/esco';

// Hand-curated adjacency map keyed by ESCO skill URI. Kept small and
// defensible — each entry pairs a routine-heavy skill with 1-2 durable
// adjacencies that we believe an LMIC worker can realistically reach.
const ADJACENT: Record<string, string[]> = {
  'S1.1.2': ['S1.1.3'],         // soldering -> diagnostics
  'S1.1.3': ['S1.2.4', 'S1.1.5'], // diagnostics -> web design / OS install
  'S1.1.4': ['S1.1.3', 'S1.1.5'], // phone repair -> diagnostics, OS install
  'S1.1.5': ['S1.2.4'],         // OS install -> web app design
  'S1.2.1': ['S1.2.4', 'S1.2.6'], // JS -> web design, python
  'S1.2.2': ['S1.2.4'],         // HTML -> web app design
  'S1.2.3': ['S1.2.4'],         // CSS -> web app design
  'S2.1.1': ['S2.1.4'],         // customer comms -> basic accounting
  'S2.1.5': ['S2.1.4'],         // cash -> basic accounting
  'S2.1.6': ['S7.1.2'],         // inventory -> spreadsheets
  'S3.1.1': ['S4.1.3'],         // engine diag -> technical drawings
  'S4.1.1': ['S4.1.3'],         // welding -> technical drawings
  'S4.1.2': ['S4.1.3'],         // pipefitting -> technical drawings
  'S4.1.5': ['S4.1.6'],         // sewing -> pattern cutting
  'S5.1.1': ['S5.1.2'],         // cooking -> food safety
  'S7.1.1': ['S7.1.2'],         // typing -> spreadsheets
  'S7.1.5': ['S2.1.1', 'S2.1.2'], // call handling -> customer comms, written english
};

// Router: given a profile's skill URIs and a risk hint (routine_share per
// skill if known), produce coaching suggestions.
export interface CoachingSuggestion {
  from_skill_uri: string;
  from_label: string;
  suggestion_uri: string;
  suggestion_label: string;
  reason: string;
}

export function resilienceGaps(
  profileSkillUris: string[],
  allSkills: EscoSkill[],
  opts: { routineByUri?: Map<string, number> } = {},
): CoachingSuggestion[] {
  const labelByUri = new Map(allSkills.map((s) => [s.uri, s.label]));
  const have = new Set(profileSkillUris);
  const out: CoachingSuggestion[] = [];
  const seenSuggestions = new Set<string>();

  for (const uri of profileSkillUris) {
    const adj = ADJACENT[uri];
    if (!adj) continue;
    const routineShare = opts.routineByUri?.get(uri) ?? 0.5;

    for (const suggestionUri of adj) {
      if (have.has(suggestionUri) || seenSuggestions.has(suggestionUri)) continue;
      seenSuggestions.add(suggestionUri);

      out.push({
        from_skill_uri: uri,
        from_label: labelByUri.get(uri) ?? uri,
        suggestion_uri: suggestionUri,
        suggestion_label: labelByUri.get(suggestionUri) ?? suggestionUri,
        reason:
          routineShare >= 0.55
            ? `This skill leans routine (share ${routineShare.toFixed(2)}); ${labelByUri.get(suggestionUri) ?? suggestionUri} is a durable adjacent step.`
            : `Builds on what the candidate already knows and opens up higher-wage roles.`,
      });
    }
  }
  // Cap at a coachable list length (navigator shouldn't drown).
  return out.slice(0, 6);
}
