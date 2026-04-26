// Local-simulator endpoint. Same state machine as /api/sms/incoming, but
// returns the reply messages in the HTTP response instead of sending them
// via AT. Used by app/sms-demo/page.tsx.

import { NextResponse } from 'next/server';
import {
  getSession,
  setSession,
} from '@/lib/sms-session-store';
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
import type { OpportunityCard } from '@/app/api/match/route';
import type { CountryCode } from '@/lib/config/countries';

const lastMatches = new Map<string, { country: CountryCode; cards: OpportunityCard[] }>();

export async function POST(req: Request) {
  const { from, text } = (await req.json()) as { from?: string; text?: string };
  if (!from || !text) {
    return NextResponse.json({ error: 'missing from or text' }, { status: 400 });
  }

  // Short-reply path: user texted "1"/"2"/"3" after receiving the jobs list
  const detailMatch = /^\s*([123])\s*$/.exec(text);
  const cached = lastMatches.get(from);
  if (detailMatch && cached && cached.cards[parseInt(detailMatch[1], 10) - 1]) {
    const idx = parseInt(detailMatch[1], 10) - 1;
    const detail = formatJobDetail(cached.cards[idx], cached.country);
    return NextResponse.json({ replies: [detail] });
  }

  const current = getSession(from) ?? newSession();
  const result = nextStep(current, text);
  setSession(from, result.state);

  const replies: string[] = [...result.reply];

  if (result.finalize) {
    const finalMsgs = await finalize(from, result.state, req.url);
    replies.push(...finalMsgs);
    setSession(from, { ...result.state, step: 'done' });
  }

  return NextResponse.json({ replies });
}

async function finalize(
  phone: string,
  state: SessionState,
  reqUrl: string,
): Promise<string[]> {
  const answers = state.answers;
  const country = (answers.country ?? 'GH') as CountryCode;

  const mapping = await mapSkills({
    education: answers.education,
    workText: answers.workText,
    toolsText: answers.toolsText,
    languages: answers.languages ?? [],
    aspirationsText: answers.aspirationsText,
  });

  const origin = new URL(reqUrl).origin;
  let cards: OpportunityCard[] = [];
  try {
    const res = await fetch(`${origin}/api/match`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ country, profileSkillUris: mapping.esco_skills }),
    });
    if (res.ok) {
      const body = (await res.json()) as { cards: OpportunityCard[] };
      cards = body.cards;
    }
  } catch {
    // empty cards fall through — skills message still rendered
  }

  lastMatches.set(phone, { country, cards });

  const escoSkills = await getEscoSkills();
  const skillLabels = new Map(
    escoSkills.value.map((s: { uri: string; label: string }) => [s.uri, s.label]),
  );

  const ctx: FinalizeContext = {
    country,
    mapping,
    cards,
    skillLabels,
  };

  return formatFinalMessages(ctx);
}
