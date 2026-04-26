// §7.1.1 — skill match is count-based ESCO `essentialSkills` overlap. No
// embeddings, no cosine similarity, no black-box ranking. Displayed as
// "N of M skills" with the missing skills named.
import type { EscoOccupation, EscoSkill } from '@/lib/data-loaders/esco';

export interface SkillMatch {
  occupation: EscoOccupation;
  matchedUris: string[];
  missingUris: string[];
  missingLabels: string[];
  matched: number;
  total: number;
  ratio: number; // matched / total, 0..1
}

export function matchSkills(
  occupation: EscoOccupation,
  profileSkillUris: string[],
  allSkills: EscoSkill[],
): SkillMatch {
  const profileSet = new Set(profileSkillUris);
  const labelByUri = new Map(allSkills.map((s) => [s.uri, s.label]));

  const matchedUris: string[] = [];
  const missingUris: string[] = [];
  for (const uri of occupation.essential_skills) {
    if (profileSet.has(uri)) matchedUris.push(uri);
    else missingUris.push(uri);
  }

  const total = occupation.essential_skills.length;
  const matched = matchedUris.length;
  return {
    occupation,
    matchedUris,
    missingUris,
    missingLabels: missingUris.map((u) => labelByUri.get(u) ?? u),
    matched,
    total,
    ratio: total === 0 ? 0 : matched / total,
  };
}

// Rank a set of occupations by match ratio (descending), ties broken by
// absolute matched count.
export function rankMatches(
  occupations: EscoOccupation[],
  profileSkillUris: string[],
  allSkills: EscoSkill[],
): SkillMatch[] {
  return occupations
    .map((occ) => matchSkills(occ, profileSkillUris, allSkills))
    .sort((a, b) => b.ratio - a.ratio || b.matched - a.matched);
}
