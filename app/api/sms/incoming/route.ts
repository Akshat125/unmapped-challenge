// Africa's Talking inbound SMS webhook.
//
// AT POSTs form-encoded:
//   from: "+233700000001"
//   to:   "12345"
//   text: "hello"
//   date: "..."
//   linkId: "..."
//
// We respond with plain text (AT ignores the response body for basic
// messaging — actual outbound messages go out via the AT REST API). For
// multi-message replies, we send each message as a separate REST call.
//
// PRODUCTION NOTE: AT signs requests with a configurable header — we skip
// signature validation in the prototype. See SMS_SETUP.md step 7.

import { NextResponse } from 'next/server';
import { getSession, setSession } from '@/lib/sms-session-store';
import {
  next as nextStep,
  newSession,
  type SessionState,
} from '@/lib/sms-state-machine';
import { mapSkills } from '@/lib/esco-mapper';
import { getEscoSkills } from '@/lib/data-loaders/esco';
import {
  formatFinalMessages,
  formatJobDetail,
  type FinalizeContext,
} from '@/lib/sms-format';
import { sendSms } from '@/lib/sms-provider';
import type { OpportunityCard } from '@/app/api/match/route';
import type { CountryCode } from '@/lib/config/countries';

// Per-phone cache of the last finalized match, so "1"/"2"/"3" replies
// resolve to job detail without re-running the pipeline.
const lastMatches = new Map<string, { country: CountryCode; cards: OpportunityCard[] }>();

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? '';
  let from = '';
  let text = '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    from = params.get('from') ?? '';
    text = params.get('text') ?? '';
  } else if (contentType.includes('application/json')) {
    const body = (await req.json()) as { from?: string; text?: string };
    from = body.from ?? '';
    text = body.text ?? '';
  } else {
    // AT sandbox sometimes sends multipart; be forgiving
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    from = params.get('from') ?? '';
    text = params.get('text') ?? '';
  }

  if (!from) {
    return new NextResponse('missing from', { status: 400 });
  }

  // Check for "show job detail" short-reply before running the state machine
  const detailMatch = /^\s*([123])\s*$/.exec(text);
  const cached = lastMatches.get(from);
  if (detailMatch && cached && cached.cards[parseInt(detailMatch[1], 10) - 1]) {
    const idx = parseInt(detailMatch[1], 10) - 1;
    const card = cached.cards[idx];
    const detail = formatJobDetail(card, cached.country);
    await sendSms(from, detail);
    return new NextResponse('ok', { status: 200 });
  }

  const current = getSession(from) ?? newSession();
  const result = nextStep(current, text);
  setSession(from, result.state);

  // Send each queued reply. AT bills per-segment, so we keep these short
  // (the state machine already budgets ~320 chars per message).
  for (const msg of result.reply) {
    await sendSms(from, msg);
  }

  if (result.finalize) {
    await finalizeAndSend(from, result.state, req.url);
  }

  return new NextResponse('ok', { status: 200 });
}

async function finalizeAndSend(
  phone: string,
  state: SessionState,
  reqUrl: string,
): Promise<void> {
  const answers = state.answers;
  const country = (answers.country ?? 'GH') as CountryCode;

  // 1. Skill map (uses the same pipeline as the web entry form)
  const mapping = await mapSkills({
    education: answers.education,
    workText: answers.workText,
    toolsText: answers.toolsText,
    languages: answers.languages ?? [],
    aspirationsText: answers.aspirationsText,
  });

  // 2. Opportunity match — call the existing /api/match route so we share
  // exactly one implementation with the web app.
  const origin = new URL(reqUrl).origin;
  let cards: OpportunityCard[] = [];
  try {
    const res = await fetch(`${origin}/api/match`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        country,
        profileSkillUris: mapping.esco_skills,
      }),
    });
    if (res.ok) {
      const body = (await res.json()) as { cards: OpportunityCard[] };
      cards = body.cards;
    }
  } catch {
    // fall through — we still send the skills message below
  }

  // 3. Cache matches for subsequent "1"/"2"/"3" replies
  lastMatches.set(phone, { country, cards });

  // 4. Build skill-URI → label lookup for pretty-printing
  const escoSkills = await getEscoSkills();
  const skillLabels = new Map(
    escoSkills.value.map((s: { uri: string; label: string }) => [s.uri, s.label]),
  );

  const ctx: FinalizeContext = {
    country,
    mapping,
    cards,
    skillLabels,
    // Optional — left undefined here; the web passport share link requires
    // a logged-in profile. Production would persist the profile and mint
    // a share token here.
    profileUrl: undefined,
  };

  for (const msg of formatFinalMessages(ctx)) {
    await sendSms(phone, msg);
  }

  // Mark session done so the next inbound resets
  setSession(phone, { ...state, step: 'done' });
}

