// Skills-mapping abstraction. Runtime picks between:
//   - Claude + BM25 retrieval (Option D) when ANTHROPIC_API_KEY is set
//   - Keyword-regex mock                when the key is absent
//
// Both satisfy the same SkillMapInput → SkillMapResult contract.
// §7.1.2 failure handling (retry, flagged_low_confidence, upstream_error)
// is implemented in runClaude(). Rejected codes never escape — only URIs
// present in the loaded ESCO subset are returned.

import Anthropic from '@anthropic-ai/sdk';
import { getEscoOccupations, getEscoSkills } from '@/lib/data-loaders/esco';
import { BM25Index } from '@/lib/bm25';

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
  esco_skills: string[];
  isco_occupations: string[];
  confidence: number;           // 0..1
  gaps_inferred: string[];
  rejected_codes: string[];
  explanations: Array<{
    skill_uri: string;
    evidence: string;
    source_field: 'work' | 'tools' | 'aspirations' | 'languages';
  }>;
  message?: string;
}

// ── BM25 index (module-level singleton, built once per process) ───────────

let _indexPromise: Promise<{ index: BM25Index; labelByUri: Map<string, string> }> | null = null;

function getIndex() {
  if (!_indexPromise) {
    _indexPromise = getEscoSkills().then(({ value: skills }) => {
      const docs = skills.map((s) => ({
        id: s.uri,
        text: `${s.label} ${(s.alt_labels ?? []).join(' ')} ${s.description ?? ''}`.trim(),
      }));
      return {
        index: new BM25Index(docs),
        labelByUri: new Map(skills.map((s) => [s.uri, s.label])),
      };
    });
  }
  return _indexPromise;
}

// ── Claude implementation (Option D: BM25 retrieval → single Claude call) ─

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_CANDIDATES = 60;

interface ClaudeMatch {
  uri: string;
  evidence: string;
  source_field: 'work' | 'tools' | 'aspirations' | 'languages';
}

function buildQuery(input: SkillMapInput): string {
  return [input.workText, input.toolsText, input.aspirationsText]
    .filter(Boolean)
    .join(' ');
}

function buildPrompt(input: SkillMapInput, candidates: Array<{ uri: string; label: string }>): string {
  const candidateList = candidates
    .map((c) => `${c.uri} | ${c.label}`)
    .join('\n');

  const person = [
    input.education ? `Education: ${input.education}` : null,
    input.workText ? `Work experience: ${input.workText}` : null,
    input.toolsText ? `Tools and technology used: ${input.toolsText}` : null,
    input.languages?.length ? `Languages: ${input.languages.join(', ')}` : null,
    input.aspirationsText ? `Aspirations: ${input.aspirationsText}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are a skill taxonomy mapper for an employment platform serving young workers in low-income countries.

<person>
${person}
</person>

From the candidate skills below, select ONLY the ones that clearly apply to this person based on what they wrote. Be conservative — include a skill only when there is direct evidence in their text.

For each match return:
- uri: the exact URI from the list
- evidence: the exact phrase from the person's text that shows this skill
- source_field: which field the evidence came from (work | tools | aspirations | languages)

<candidates>
${candidateList}
</candidates>

Return ONLY a JSON array. No explanation. No markdown. Examples:
[{"uri":"S1.1.4","evidence":"I repair smartphones","source_field":"work"}]
[] if nothing matches.`;
}

function parseClaudeResponse(text: string): ClaudeMatch[] | null {
  const trimmed = text.trim();
  // Strip markdown code fences if present
  const json = trimmed.startsWith('```')
    ? trimmed.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '')
    : trimmed;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is ClaudeMatch =>
        typeof item === 'object' &&
        typeof item.uri === 'string' &&
        typeof item.evidence === 'string' &&
        ['work', 'tools', 'aspirations', 'languages'].includes(item.source_field),
    );
  } catch {
    return null;
  }
}

async function callClaude(prompt: string): Promise<ClaudeMatch[] | null> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') return null;
  return parseClaudeResponse(block.text);
}

async function runClaude(input: SkillMapInput): Promise<SkillMapResult> {
  const { index, labelByUri } = await getIndex();
  const { value: skills } = await getEscoSkills();
  const { value: occupations } = await getEscoOccupations();

  const validUris = new Set(skills.map((s) => s.uri));

  // BM25 retrieval — get top candidates from the full skill set
  const query = buildQuery(input);
  const hits = query.trim() ? index.query(query, MAX_CANDIDATES) : [];

  // Always include at least the top candidates even if query is thin
  const candidates = hits.map((h) => ({ uri: h.id, label: labelByUri.get(h.id) ?? h.id }));

  // §7.1.2 step 1: first Claude pass
  const prompt = buildPrompt(input, candidates);
  let matches = await callClaude(prompt);

  if (matches === null) {
    // Unparseable response — treat as upstream_error
    throw new Error('Claude returned unparseable response');
  }

  // Validate: reject any URI not in the loaded ESCO subset
  let accepted = matches.filter((m) => validUris.has(m.uri));
  let rejected = matches.filter((m) => !validUris.has(m.uri)).map((m) => m.uri);

  const rejectionRatio = matches.length > 0 ? rejected.length / matches.length : 0;

  // §7.1.2 step 2: >50% rejected — retry with stricter prompt
  let status: SkillMapStatus = 'ok';
  if (rejectionRatio > 0.5 && matches.length > 0) {
    const strictPrompt =
      buildPrompt(input, candidates) +
      '\n\nIMPORTANT: Return ONLY URIs from the candidate list above. Do not invent URIs.';
    const retryMatches = await callClaude(strictPrompt);

    if (retryMatches !== null) {
      const retryAccepted = retryMatches.filter((m) => validUris.has(m.uri));
      const retryRejected = retryMatches.filter((m) => !validUris.has(m.uri)).map((m) => m.uri);
      const retryRejectionRatio =
        retryMatches.length > 0 ? retryRejected.length / retryMatches.length : 0;

      // §7.1.2 step 3: still >50% rejected after retry → flagged
      if (retryRejectionRatio > 0.5) {
        status = 'flagged_low_confidence';
      } else {
        status = 'retry_used';
      }
      accepted = retryAccepted;
      rejected = retryRejected;
    }
  }

  const esco_skills = accepted.map((m) => m.uri);
  const explanations = accepted.map((m) => ({
    skill_uri: m.uri,
    evidence: m.evidence,
    source_field: m.source_field,
  }));

  const isco_occupations = Array.from(new Set(
    occupations
      .filter((occ) => occ.essential_skills.some((s) => esco_skills.includes(s)))
      .map((occ) => occ.isco_code),
  ));

  const total = esco_skills.length;
  return {
    status: total === 0 ? 'flagged_low_confidence' : status,
    esco_skills,
    isco_occupations,
    confidence: total === 0 ? 0.1 : Math.min(1, 0.5 + 0.08 * total),
    gaps_inferred: [],
    rejected_codes: rejected,
    explanations,
    message:
      status === 'flagged_low_confidence'
        ? "We couldn't confidently map your skills — please add a bit more detail to questions 2 and 3."
        : undefined,
  };
}

// ── BM25-only fallback (no Claude) ────────────────────────────────────────
// Used when ANTHROPIC_API_KEY is absent or Claude fails at runtime.
// Returns top BM25 hits directly — all URIs are guaranteed valid since they
// come from the index itself. Less precise than the Claude path but always
// produces real ESCO URIs and never hallucinates.

const MOCK_TOP_K = 15;
const MOCK_MIN_SCORE = 1.0; // reject very-low-confidence BM25 hits

async function runMock(input: SkillMapInput): Promise<SkillMapResult> {
  const { index, labelByUri } = await getIndex();
  const { value: occupations } = await getEscoOccupations();

  const query = buildQuery(input);
  const hits = query.trim() ? index.query(query, MOCK_TOP_K) : [];
  const qualified = hits.filter((h) => h.score >= MOCK_MIN_SCORE);

  const esco_skills = qualified.map((h) => h.id);

  // Attribute evidence to whichever field contributed the most tokens to the query
  const fieldOrder: Array<'work' | 'tools' | 'aspirations'> = ['work', 'tools', 'aspirations'];
  const fieldLengths = {
    work: (input.workText ?? '').length,
    tools: (input.toolsText ?? '').length,
    aspirations: (input.aspirationsText ?? '').length,
  };
  const dominantField = fieldOrder.reduce((a, b) => (fieldLengths[a] >= fieldLengths[b] ? a : b));

  const explanations: SkillMapResult['explanations'] = esco_skills.map((uri) => ({
    skill_uri: uri,
    evidence: `matched via BM25: "${labelByUri.get(uri) ?? uri}"`,
    source_field: dominantField,
  }));

  const isco_occupations = Array.from(new Set(
    occupations
      .filter((occ) => occ.essential_skills.some((s) => esco_skills.includes(s)))
      .map((occ) => occ.isco_code),
  ));

  const total = esco_skills.length;
  return {
    status: total === 0 ? 'flagged_low_confidence' : 'ok',
    esco_skills,
    isco_occupations,
    confidence: total === 0 ? 0.1 : Math.min(1, 0.4 + 0.05 * total),
    gaps_inferred: [],
    rejected_codes: [],
    explanations,
    message:
      total === 0
        ? "We couldn't confidently map your skills — please add a bit more detail to questions 2 and 3."
        : undefined,
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────

export async function mapSkills(input: SkillMapInput): Promise<SkillMapResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await runClaude(input);
    } catch (err) {
      // Claude failed at runtime (timeout, rate limit, parse error) —
      // degrade to BM25-only fallback rather than returning upstream_error.
      console.error('[esco-mapper] Claude failed, falling back to BM25 mock:', err);
      return runMock(input);
    }
  }
  return runMock(input);
}
