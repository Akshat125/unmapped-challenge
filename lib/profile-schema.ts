// unmapped.profile/v1 — JSON-LD schema for portable skill identities.
// Spec §1 of V3.0. The same schema is produced by:
//   • /profile (youth self-serve export)
//   • /navigator/[id] (navigator-mediated export)
// and consumed by:
//   • /employer (skill-first candidate decoder)
//   • /share/[token] (read-only view for employers with a share link)
//
// We version the schema explicitly so a v2 can ship without breaking existing
// export files in the wild.

export const PROFILE_SCHEMA_VERSION = 'unmapped.profile/v1';
export const JSONLD_CONTEXT = 'https://unmapped.example/schema/profile/v1';

export interface ProfileSignal {
  skill_code: string;           // ESCO skill URI
  task_description: string;     // plain-language description (from input or catalog label)
  confidence: number;           // 0..1 mapping confidence
}

export type VerificationMethod = 'observation' | 'test' | 'peer_vouch' | 'training_certificate';

export interface ProfileVerification {
  navigator_id: string;         // UUID of the navigator
  navigator_name: string;       // display name — for convenience, not auth
  skill_code: string;           // which ESCO skill is verified
  method: VerificationMethod;
  date: string;                 // ISO-8601
  signature: string;            // HMAC-style content hash (§1 audit trail requirement)
  note?: string;
}

export interface ProfileRisk {
  isco_code: string;
  base_exposure: number;        // Frey-Osborne raw, 0..1
  calibrated_risk: number;      // near-term, LMIC-calibrated, 0..1
  last_calc_date: string;       // ISO-8601
  skill_complexity_score: number;
  infrastructure_delay_factor: number;
}

export interface ProfileV1 {
  '@context': string;
  '@type': 'SkillIdentity';
  schema: typeof PROFILE_SCHEMA_VERSION;
  core: {
    id: string;                 // UUID, Decentralized Skill Identity
    timestamp: string;          // ISO-8601
    standard: 'ISCO-08';
  };
  country: string;              // ISO-3166 alpha-2
  subject: {
    display_name?: string;
    education?: string;
    languages?: string[];
    self_report: {
      work_text?: string;
      tools_text?: string;
      aspirations_text?: string;
    };
  };
  signals: ProfileSignal[];
  isco_occupations: string[];
  verifications: ProfileVerification[];
  risk_profile: ProfileRisk[];
  navigator?: { id: string; name: string };
}

// ---- UUID ----------------------------------------------------------------
// crypto.randomUUID is universal in modern browsers + Node 18. Fallback
// kept because spec §3 says 5-year-old Android browsers must work.
export function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const s = Array.from(b, hex).join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// ---- Signature -----------------------------------------------------------
// §1 "immutable audit trail linked to navigator's unique ID". We don't run
// a real PKI in the prototype; we produce a deterministic content hash over
// (navigator_id + skill_code + method + date + note). An auditor can recompute
// it and detect tampering of any individual field.
export async function signVerification(
  parts: Omit<ProfileVerification, 'signature' | 'navigator_name'>,
): Promise<string> {
  const material = [
    parts.navigator_id,
    parts.skill_code,
    parts.method,
    parts.date,
    parts.note ?? '',
  ].join('|');

  if (typeof crypto !== 'undefined' && 'subtle' in crypto) {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(material));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback: synchronous DJB2 — weaker but non-blocking for the prototype.
  let h = 5381;
  for (let i = 0; i < material.length; i++) h = ((h << 5) + h + material.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

// ---- Validation ----------------------------------------------------------
export interface SchemaIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

export function validateProfileV1(input: unknown): { ok: boolean; issues: SchemaIssue[] } {
  const issues: SchemaIssue[] = [];
  const err = (path: string, message: string) =>
    issues.push({ path, severity: 'error', message });
  const warn = (path: string, message: string) =>
    issues.push({ path, severity: 'warning', message });

  if (!input || typeof input !== 'object') {
    return { ok: false, issues: [{ path: '(root)', severity: 'error', message: 'not an object' }] };
  }
  const p = input as Record<string, unknown>;
  if (p.schema !== PROFILE_SCHEMA_VERSION) {
    err('schema', `expected "${PROFILE_SCHEMA_VERSION}", got ${String(p.schema)}`);
  }
  if ((p['@type'] as string) !== 'SkillIdentity') {
    warn('@type', 'missing or non-standard @type');
  }
  const core = p.core as Record<string, unknown> | undefined;
  if (!core || typeof core.id !== 'string' || !core.id) err('core.id', 'missing UUID');
  if (!core || core.standard !== 'ISCO-08') warn('core.standard', 'expected "ISCO-08"');
  if (!Array.isArray(p.signals)) err('signals', 'must be an array');
  if (!Array.isArray(p.verifications)) err('verifications', 'must be an array');
  if (!Array.isArray(p.risk_profile)) err('risk_profile', 'must be an array');

  return { ok: issues.every((i) => i.severity !== 'error'), issues };
}
