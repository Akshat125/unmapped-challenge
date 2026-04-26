import { NextResponse } from 'next/server';
import { mapJobDescription } from '@/lib/jd-mapper';

// POST /api/map-job-description
// Body: { text: string }
// Returns JdMapResult. Used by the employer JD ingestion UI (V3.0 §2 Step 1B).
export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'empty_text' }, { status: 400 });
  }
  const result = await mapJobDescription(text);
  return NextResponse.json(result);
}
