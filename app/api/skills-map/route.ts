import { NextResponse } from 'next/server';
import { mapSkills, type SkillMapInput } from '@/lib/esco-mapper';

// POST /api/skills-map
// Contract documented in /lib/esco-mapper.ts. Returns the full SkillMapResult.
// Status codes:
//   200 — ok / flagged_low_confidence / retry_used (UI handles these by status field)
//   400 — malformed body
//   502 — upstream_error (Claude API unreachable)
export async function POST(req: Request) {
  let body: SkillMapInput;
  try {
    body = (await req.json()) as SkillMapInput;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const result = await mapSkills(body);

  const httpStatus = result.status === 'upstream_error' ? 502 : 200;
  return NextResponse.json(result, { status: httpStatus });
}
