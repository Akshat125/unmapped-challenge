// Resilience gaps — given a youth's mapped skills, suggest adjacent durable
// skills worth training toward. Uses token overlap between skill descriptions
// to find neighbours. All skills are pre-tokenized once per call to avoid
// O(profile × corpus) re-tokenization.

import type { EscoSkill } from '@/lib/data-loaders/esco';

export interface CoachingSuggestion {
  from_skill_uri: string;
  from_label: string;
  suggestion_uri: string;
  suggestion_label: string;
  reason: string;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 3),
  );
}

export function resilienceGaps(
  profileSkillUris: string[],
  allSkills: EscoSkill[],
  opts: { routineByUri?: Map<string, number> } = {},
): CoachingSuggestion[] {
  if (profileSkillUris.length === 0 || allSkills.length === 0) return [];

  const have = new Set(profileSkillUris);
  const byUri = new Map(allSkills.map((s) => [s.uri, s]));

  // Pre-tokenize every skill once — avoids re-tokenizing 13,960 skills for
  // each profile skill in the inner loop.
  const tokensByUri = new Map(
    allSkills.map((s) => [s.uri, tokenize(`${s.label} ${s.description ?? ''}`)]),
  );

  const suggestions: CoachingSuggestion[] = [];
  const seen = new Set<string>();

  for (const uri of profileSkillUris) {
    const skill = byUri.get(uri);
    if (!skill) continue;

    const queryTokens = tokensByUri.get(uri)!;
    if (queryTokens.size === 0) continue;

    let best: { uri: string; score: number } | null = null;
    for (const candidate of allSkills) {
      if (have.has(candidate.uri) || seen.has(candidate.uri)) continue;
      const candTokens = tokensByUri.get(candidate.uri)!;
      let overlap = 0;
      for (const t of queryTokens) if (candTokens.has(t)) overlap++;
      const score = overlap / Math.max(1, Math.sqrt(queryTokens.size * candTokens.size));
      if (!best || score > best.score) best = { uri: candidate.uri, score };
    }

    if (!best || best.score === 0) continue;
    seen.add(best.uri);
    const suggestion = byUri.get(best.uri)!;
    const routineShare = opts.routineByUri?.get(uri) ?? 0.5;

    suggestions.push({
      from_skill_uri: uri,
      from_label: skill.label,
      suggestion_uri: best.uri,
      suggestion_label: suggestion.label,
      reason:
        routineShare >= 0.55
          ? `This skill leans routine; ${suggestion.label} is a durable adjacent step.`
          : `Builds on what the candidate already knows and opens up higher-wage roles.`,
    });

    if (suggestions.length >= 6) break;
  }

  return suggestions;
}
