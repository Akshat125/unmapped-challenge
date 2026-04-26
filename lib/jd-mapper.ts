// Natural-language Job Description → ISCO-08 + ESCO codes, with highlight
// spans so the employer UI can surface "we identified X because you wrote Y".
// Mirrors the youth-side esco-mapper contract.

import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';

export interface JdMatchSpan {
  start: number;
  end: number;
  skill_uri: string;
  matched_text: string;
}

export interface JdMapResult {
  // Raw JD text, returned verbatim so the UI can highlight spans.
  input_text: string;
  esco_skills: string[];
  isco_occupations: string[];          // ranked by overlap count
  isco_top_occupation: string | null;  // single headline ISCO code
  confidence: number;
  highlights: JdMatchSpan[];
  explanations: Array<{
    skill_uri: string;
    evidence: string;
  }>;
}

// Same keyword rules as the youth mapper — kept duplicated intentionally so
// the two mappers stay independent and swappable (youth → Claude first).
// Mapping to a single file would couple them at the wrong seam.
const RULES: Array<{ pattern: RegExp; skillUri: string }> = [
  { pattern: /\b(phone|mobile|smartphone|android|iphone)\b/i, skillUri: 'S1.1.4' },
  { pattern: /\b(solder|soldering)\b/i, skillUri: 'S1.1.2' },
  { pattern: /\b(repair|fix|fixing|troubleshoot|diagnos\w*)\b/i, skillUri: 'S1.1.3' },
  { pattern: /\b(hand tool|screwdriver|pliers)\b/i, skillUri: 'S1.1.1' },
  { pattern: /\b(operating system|windows|linux|install(?:ation)?)\b/i, skillUri: 'S1.1.5' },
  { pattern: /\b(website|web(site)?|frontend|front-end|web app)\b/i, skillUri: 'S1.2.4' },
  { pattern: /\bhtml\b/i, skillUri: 'S1.2.2' },
  { pattern: /\bcss\b/i, skillUri: 'S1.2.3' },
  { pattern: /\b(javascript|js)\b/i, skillUri: 'S1.2.1' },
  { pattern: /\bpython\b/i, skillUri: 'S1.2.6' },
  { pattern: /\b(git|github|version control)\b/i, skillUri: 'S1.2.5' },
  { pattern: /\b(sql|database)\b/i, skillUri: 'S1.2.7' },
  { pattern: /\b(customer|client)\b/i, skillUri: 'S2.1.1' },
  { pattern: /\b(write|writing|written|email|english)\b/i, skillUri: 'S2.1.2' },
  { pattern: /\b(cash|money|payment)\b/i, skillUri: 'S2.1.5' },
  { pattern: /\b(inventory|stock|stocktaking)\b/i, skillUri: 'S2.1.6' },
  { pattern: /\b(account(ing|s)?|bookkeeping)\b/i, skillUri: 'S2.1.4' },
  { pattern: /\b(typing|keyboard)\b/i, skillUri: 'S7.1.1' },
  { pattern: /\b(excel|spreadsheet)\b/i, skillUri: 'S7.1.2' },
  { pattern: /\b(weld(ing|er)?)\b/i, skillUri: 'S4.1.1' },
  { pattern: /\b(pipe|plumb(ing|er)?)\b/i, skillUri: 'S4.1.2' },
  { pattern: /\b(carpenter|woodwork|joinery)\b/i, skillUri: 'S4.1.4' },
  { pattern: /\b(sew(ing)?|tailor|garment|stitch)\b/i, skillUri: 'S4.1.5' },
  { pattern: /\bpattern\b/i, skillUri: 'S4.1.6' },
  { pattern: /\b(car|vehicle|engine|mechanic)\b/i, skillUri: 'S3.1.1' },
  { pattern: /\b(driv(ing|er))\b/i, skillUri: 'S3.1.3' },
  { pattern: /\b(cook|kitchen|chef)\b/i, skillUri: 'S5.1.1' },
  { pattern: /\b(food safety|hygiene)\b/i, skillUri: 'S5.1.2' },
  { pattern: /\b(crop|farm|plant(ing)?|harvest)\b/i, skillUri: 'S6.1.1' },
  { pattern: /\b(clean(ing)?|sweep|mop)\b/i, skillUri: 'S6.1.2' },
  { pattern: /\b(call|phone support|helpdesk)\b/i, skillUri: 'S7.1.5' },
];

export async function mapJobDescription(text: string): Promise<JdMapResult> {
  const { value: skills } = await getEscoSkills();
  const { value: occupations } = await getEscoOccupations();
  const validUris = new Set(skills.map((s) => s.uri));

  const highlights: JdMatchSpan[] = [];
  const matchedUris = new Set<string>();
  const explanations: JdMapResult['explanations'] = [];

  // Walk each rule and collect all highlights for visual transparency.
  for (const { pattern, skillUri } of RULES) {
    const re = new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (!validUris.has(skillUri)) continue;
      highlights.push({
        start: m.index,
        end: m.index + m[0].length,
        skill_uri: skillUri,
        matched_text: m[0],
      });
      if (!matchedUris.has(skillUri)) {
        matchedUris.add(skillUri);
        explanations.push({ skill_uri: skillUri, evidence: m[0] });
      }
      if (m.index === re.lastIndex) re.lastIndex += 1; // zero-length guard
    }
  }

  // Rank ISCO occupations by essentialSkills overlap with matched URIs.
  const esco_skills = Array.from(matchedUris);
  const rankedOccupations = occupations
    .map((o) => ({
      code: o.isco_code,
      overlap: o.essential_skills.filter((s) => matchedUris.has(s)).length,
      total: o.essential_skills.length,
    }))
    .filter((o) => o.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.total - b.total);

  const total = esco_skills.length;
  return {
    input_text: text,
    esco_skills,
    isco_occupations: rankedOccupations.map((o) => o.code),
    isco_top_occupation: rankedOccupations[0]?.code ?? null,
    confidence: total === 0 ? 0.0 : Math.min(1, 0.3 + 0.1 * total),
    highlights: highlights.sort((a, b) => a.start - b.start),
    explanations,
  };
}
