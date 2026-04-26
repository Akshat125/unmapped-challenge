// Employer job description → ESCO skills + ISCO occupations.
// Uses BM25 retrieval over the full 13,960-skill index — same index as the
// youth mapper. Returns highlight spans where skill labels appear verbatim
// in the JD text so the employer UI can surface "we identified X because Y".

import { getEscoOccupations } from '@/lib/data-loaders/esco';
import { getEscoIndex } from '@/lib/esco-bm25-index';

export interface JdMatchSpan {
  start: number;
  end: number;
  skill_uri: string;
  matched_text: string;
}

export interface JdMapResult {
  input_text: string;
  esco_skills: string[];
  isco_occupations: string[];
  isco_top_occupation: string | null;
  confidence: number;
  highlights: JdMatchSpan[];
  explanations: Array<{ skill_uri: string; evidence: string }>;
}

const TOP_K = 20;
const MIN_SCORE = 1.0;

export async function mapJobDescription(text: string): Promise<JdMapResult> {
  const { index, labelByUri } = await getEscoIndex();
  const { value: occupations } = await getEscoOccupations();

  const hits = text.trim() ? index.query(text, TOP_K) : [];
  const qualified = hits.filter((h) => h.score >= MIN_SCORE);

  const esco_skills = qualified.map((h) => h.id);
  const highlights: JdMatchSpan[] = [];
  const explanations: JdMapResult['explanations'] = [];

  for (const uri of esco_skills) {
    const label = labelByUri.get(uri) ?? '';
    if (!label) continue; // guard against empty-pattern infinite loop
    // Find verbatim label mentions in the JD for highlight spans.
    const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m: RegExpExecArray | null;
    let found = false;
    while ((m = re.exec(text)) !== null) {
      highlights.push({ start: m.index, end: m.index + m[0].length, skill_uri: uri, matched_text: m[0] });
      found = true;
    }
    explanations.push({
      skill_uri: uri,
      evidence: found ? `"${label}" found in job description` : `matched via BM25: "${label}"`,
    });
  }

  const rankedOccupations = occupations
    .map((o) => ({
      code: o.isco_code,
      overlap: o.essential_skills.filter((s) => esco_skills.includes(s)).length,
      total: o.essential_skills.length,
    }))
    .filter((o) => o.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.total - b.total);

  const dedupedOccupations = Array.from(new Set(rankedOccupations.map((o) => o.code)));
  const total = esco_skills.length;

  return {
    input_text: text,
    esco_skills,
    isco_occupations: dedupedOccupations,
    isco_top_occupation: dedupedOccupations[0] ?? null,
    confidence: total === 0 ? 0 : Math.min(1, 0.3 + 0.05 * total),
    highlights: highlights.sort((a, b) => a.start - b.start),
    explanations,
  };
}
