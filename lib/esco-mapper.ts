// Skills-mapping abstraction. The runtime picks between a deterministic
// keyword-matcher mock (this session) and a Claude call (next session)
// based on the presence of ANTHROPIC_API_KEY.
//
// Contract both implementations satisfy:
//   input:  SkillMapInput
//   output: SkillMapResult
//
// The §7.1.2 failure-handling cases are shaped here so the API route can
// stay thin. Rejected codes are always counted against the loaded ESCO
// subset — no hallucinated skill URIs are ever returned.

import { getEscoOccupations, getEscoSkills } from '@/lib/data-loaders/esco';

export interface SkillMapInput {
  education?: string;
  workText?: string;
  toolsText?: string;
  languages?: string[];
  aspirationsText?: string;
}

export type SkillMapStatus =
  | 'ok'
  | 'flagged_low_confidence'    // §7.1.2 step 3: >50% rejected after retry
  | 'retry_used'                // §7.1.2 step 2: first pass >50% rejected, retry kept
  | 'upstream_error';           // §7.1.2 step 4: Claude API error

export interface SkillMapResult {
  status: SkillMapStatus;
  esco_skills: string[];        // URIs from the loaded subset only
  isco_occupations: string[];   // ISCO-08 codes from the loaded subset only
  confidence: number;           // 0..1
  gaps_inferred: string[];      // human-readable labels of missing skills
  rejected_codes: string[];     // codes Claude returned but we couldn't validate
  message?: string;             // user-facing text for flagged/error states
  // XAI (V3.0 core rule #1): per-skill explanation of WHY this code was
  // chosen, so the user can verify or correct the mapping.
  explanations: Array<{
    skill_uri: string;
    evidence: string;           // the phrase from user input that triggered it
    source_field: 'work' | 'tools' | 'aspirations' | 'languages';
  }>;
}

// ──── Mock implementation ────────────────────────────────────────────────
//
// Keyword-based matcher. Walks the input free-text, looks for substrings
// that match skill labels in esco_skills.json, and returns the union.
// Deterministic — same input always produces the same output.
const KEYWORD_RULES: Array<{ pattern: RegExp; skillUri: string }> = [
  // Phone / electronics repair
  { pattern: /\bphone|mobile|smartphone|android|iphone\b/i, skillUri: 'S1.1.4' },
  { pattern: /\bsolder|soldering iron\b/i, skillUri: 'S1.1.2' },
  { pattern: /\brepair|fix|fixing\b/i, skillUri: 'S1.1.3' },
  { pattern: /\bhand tool|screwdriver|pliers\b/i, skillUri: 'S1.1.1' },
  { pattern: /\boperating system|windows|linux|install(?:ation)?\b/i, skillUri: 'S1.1.5' },

  // Web / software
  { pattern: /\b(website|web(site)?|frontend|front-end)\b/i, skillUri: 'S1.2.4' },
  { pattern: /\bhtml\b/i, skillUri: 'S1.2.2' },
  { pattern: /\bcss\b/i, skillUri: 'S1.2.3' },
  { pattern: /\bjavascript|js\b/i, skillUri: 'S1.2.1' },
  { pattern: /\bpython\b/i, skillUri: 'S1.2.6' },
  { pattern: /\bgit|github|version control\b/i, skillUri: 'S1.2.5' },
  { pattern: /\bsql|database\b/i, skillUri: 'S1.2.7' },

  // Service / sales / office
  { pattern: /\bcustomer|client\b/i, skillUri: 'S2.1.1' },
  { pattern: /\bwrite|writing|written|email\b/i, skillUri: 'S2.1.2' },
  { pattern: /\bcash|money|payment\b/i, skillUri: 'S2.1.5' },
  { pattern: /\binventory|stock\b/i, skillUri: 'S2.1.6' },
  { pattern: /\baccount(ing|s)?|bookkeeping\b/i, skillUri: 'S2.1.4' },
  { pattern: /\btyping|type|keyboard\b/i, skillUri: 'S7.1.1' },
  { pattern: /\bexcel|spreadsheet\b/i, skillUri: 'S7.1.2' },

  // Trades
  { pattern: /\bweld(ing|er)?\b/i, skillUri: 'S4.1.1' },
  { pattern: /\bpipe|plumb(ing|er)?\b/i, skillUri: 'S4.1.2' },
  { pattern: /\bcarpenter|woodwork|joinery\b/i, skillUri: 'S4.1.4' },
  { pattern: /\bsew(ing)?|tailor|garment|stitch\b/i, skillUri: 'S4.1.5' },
  { pattern: /\bpattern\b/i, skillUri: 'S4.1.6' },

  // Vehicle
  { pattern: /\bcar|vehicle|engine|mechanic\b/i, skillUri: 'S3.1.1' },
  { pattern: /\bdriv(ing|er)\b/i, skillUri: 'S3.1.3' },

  // Cooking / agriculture
  { pattern: /\bcook|kitchen|chef\b/i, skillUri: 'S5.1.1' },
  { pattern: /\bhygiene|food safety\b/i, skillUri: 'S5.1.2' },
  { pattern: /\bcrop|farm|plant(ing)?|harvest\b/i, skillUri: 'S6.1.1' },
  { pattern: /\bclean(ing)?|sweep|mop\b/i, skillUri: 'S6.1.2' },
];

async function runMock(input: SkillMapInput): Promise<SkillMapResult> {
  const sources: Array<{ field: 'work' | 'tools' | 'aspirations'; text: string }> = [
    { field: 'work', text: input.workText ?? '' },
    { field: 'tools', text: input.toolsText ?? '' },
    { field: 'aspirations', text: input.aspirationsText ?? '' },
  ];

  // Per-URI record of which phrase and field triggered the match — feeds
  // the XAI layer (V3.0 rule #1).
  const firstEvidence = new Map<string, { field: 'work' | 'tools' | 'aspirations' | 'languages'; evidence: string }>();
  for (const { pattern, skillUri } of KEYWORD_RULES) {
    if (firstEvidence.has(skillUri)) continue;
    for (const src of sources) {
      const m = src.text.match(pattern);
      if (m && m[0]) {
        firstEvidence.set(skillUri, { field: src.field, evidence: m[0] });
        break;
      }
    }
  }

  if ((input.languages ?? []).includes('en')) {
    firstEvidence.set('S2.1.2', { field: 'languages', evidence: 'English listed among spoken languages' });
  }
  if ((input.languages ?? []).some((l) => l !== 'en')) {
    const nonEn = (input.languages ?? []).filter((l) => l !== 'en').join(', ');
    firstEvidence.set('S2.1.3', { field: 'languages', evidence: `Local language fluency: ${nonEn}` });
  }

  // Validate every returned URI against the loaded ESCO subset.
  const { value: skills } = await getEscoSkills();
  const validUris = new Set(skills.map((s) => s.uri));
  const esco_skills: string[] = [];
  const rejected_codes: string[] = [];
  const explanations: SkillMapResult['explanations'] = [];
  for (const [uri, ev] of firstEvidence) {
    if (validUris.has(uri)) {
      esco_skills.push(uri);
      explanations.push({
        skill_uri: uri,
        evidence: ev.evidence,
        source_field: ev.field,
      });
    } else {
      rejected_codes.push(uri);
    }
  }

  // Suggest matching ISCO occupations — the ones whose essentialSkills
  // overlap with the profile. This is a hint for the opportunities page.
  const { value: occupations } = await getEscoOccupations();
  const isco_occupations = occupations
    .filter((occ) =>
      occ.essential_skills.some((s) => esco_skills.includes(s)),
    )
    .map((occ) => occ.isco_code);

  // Zero-match handling: if the user gave no parseable text, flag it.
  const total = esco_skills.length;
  const empty = total === 0;

  return {
    status: empty ? 'flagged_low_confidence' : 'ok',
    esco_skills,
    isco_occupations,
    confidence: empty ? 0.1 : Math.min(1, 0.4 + 0.08 * total),
    gaps_inferred: [],
    rejected_codes,
    explanations,
    message: empty
      ? "We couldn't confidently map your skills — please add a bit more detail to questions 2 and 3."
      : undefined,
  };
}

// ──── Claude implementation (stub) ───────────────────────────────────────
//
// Left unimplemented this session — the swap point is just this function.
// §7.1.2 steps 1-4 will be implemented here:
//   1. Validate codes against validUris. <=50% rejected => accept.
//   2. 50%-100% rejected => retry with stricter prompt (lower temp, explicit
//      "respond only with valid ESCO codes from this list").
//   3. Retry still >50% rejected => return flagged_low_confidence.
//   4. API error => return upstream_error with the preserved-input message.
async function runClaude(_input: SkillMapInput): Promise<SkillMapResult> {
  throw new Error(
    'Claude skills mapper not yet implemented. Set ANTHROPIC_API_KEY and wire ' +
      '@anthropic-ai/sdk here in the next build step.',
  );
}

export async function mapSkills(input: SkillMapInput): Promise<SkillMapResult> {
  // Prototype path: Claude implementation is a stub (see runClaude above).
  // When ANTHROPIC_API_KEY is set but the stub throws we still want the
  // deterministic keyword mock to answer, not a dead upstream_error branch —
  // otherwise the /sms-demo flow shows "no skills recognized" for everyone.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await runClaude(input);
    } catch {
      return runMock(input);
    }
  }
  return runMock(input);
}
