import { NextResponse } from 'next/server';

// POST /api/policymaker/validate-config
// Validates a candidate country-config JSON against the CountryConfig
// schema and returns a structured report. No side-effects — this is the
// API surface a real deployment would use for config upload with auth.

interface ValidationIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const issues: ValidationIssue[] = [];
  const c = body as Record<string, unknown>;

  const REQUIRED: Array<[string, (v: unknown) => boolean, string]> = [
    ['code', isString, 'must be a non-empty 2-letter country code'],
    ['name', isString, 'must be a non-empty country name'],
    ['locale', isString, 'must be a BCP-47 locale tag (e.g. en, bn)'],
    ['currencyLabel', isString, 'must be a non-empty currency label'],
    ['opportunityEmphasis', isString, 'must be self_employment_gig or formal_training'],
    ['broadbandPenetration', isNumber, 'ITU broadband, 0..100'],
    ['routineTaskShare', isNumber, 'ILO routine-task share, 0..1'],
  ];
  for (const [key, check, msg] of REQUIRED) {
    if (!check(c[key])) issues.push({ path: key, severity: 'error', message: msg });
  }
  if (isNumber(c.broadbandPenetration) && (c.broadbandPenetration < 0 || c.broadbandPenetration > 100)) {
    issues.push({
      path: 'broadbandPenetration',
      severity: 'error',
      message: 'must be within 0..100',
    });
  }
  if (isNumber(c.routineTaskShare) && (c.routineTaskShare < 0 || c.routineTaskShare > 1)) {
    issues.push({ path: 'routineTaskShare', severity: 'error', message: 'must be within 0..1' });
  }
  if (c.opportunityEmphasis !== 'self_employment_gig' && c.opportunityEmphasis !== 'formal_training') {
    issues.push({
      path: 'opportunityEmphasis',
      severity: 'error',
      message: 'must be self_employment_gig or formal_training',
    });
  }

  const eduLevels = (c.educationLevels ?? []) as unknown[];
  if (!Array.isArray(eduLevels) || eduLevels.length === 0) {
    issues.push({
      path: 'educationLevels',
      severity: 'error',
      message: 'must be a non-empty array of { id, label }',
    });
  } else {
    eduLevels.forEach((lvl, i) => {
      const l = lvl as Record<string, unknown>;
      if (!isString(l.id) || !isString(l.label)) {
        issues.push({
          path: `educationLevels[${i}]`,
          severity: 'error',
          message: 'each level must have { id: string, label: string }',
        });
      }
    });
  }

  const languages = (c.languages ?? []) as unknown[];
  if (!Array.isArray(languages) || languages.length === 0) {
    issues.push({
      path: 'languages',
      severity: 'warning',
      message: 'no languages listed — entry-flow language picker will be empty',
    });
  }

  const providers = (c.trainingProviders ?? []) as unknown[];
  if (!Array.isArray(providers) || providers.length === 0) {
    issues.push({
      path: 'trainingProviders',
      severity: 'warning',
      message: 'no training providers listed — pathway cards will lack referral names',
    });
  }

  const ok = issues.every((i) => i.severity !== 'error');
  return NextResponse.json({ ok, issues });
}
