// Pure formatters: turn a skill-map result + match cards into SMS-friendly
// strings. Each message is budgeted at roughly 320 chars (= 2 SMS segments
// in GSM-7). We never truncate hard — we prefer fewer, shorter lines.

import type { SkillMapResult } from './esco-mapper';
import type { OpportunityCard } from '@/app/api/match/route';
import { COUNTRIES, type CountryCode } from './config/countries';

export interface FinalizeContext {
  country: CountryCode;
  mapping: SkillMapResult;
  cards: OpportunityCard[];
  skillLabels: Map<string, string>; // ESCO URI -> label (from catalog)
  profileUrl?: string;
}

// ──── Individual messages ────────────────────────────────────────────────

export function formatSkillsMessage(ctx: FinalizeContext): string {
  const labels = ctx.mapping.esco_skills
    .map((uri) => ctx.skillLabels.get(uri) ?? uri)
    .slice(0, 6);
  if (labels.length === 0) {
    return (
      'We could not recognize clear skills from your answers. ' +
      'Reply RESTART and try adding more detail to the work question.'
    );
  }
  return (
    `Your skill profile (${ctx.mapping.esco_skills.length} skills found):\n` +
    labels.map((l) => `• ${l}`).join('\n') +
    (ctx.mapping.esco_skills.length > labels.length
      ? `\n…and ${ctx.mapping.esco_skills.length - labels.length} more.`
      : '')
  );
}

export function formatJobsMessage(ctx: FinalizeContext): string {
  if (ctx.cards.length === 0) {
    return 'No job matches yet — try RESTART and add more detail.';
  }
  const top = ctx.cards.slice(0, 3);
  const lines = top.map((c, i) => {
    const pct = Math.round((c.match.matched / Math.max(1, c.match.total)) * 100);
    return `${i + 1}. ${c.preferred_label} — ${pct}% match`;
  });
  return `Top jobs for you:\n${lines.join('\n')}\nReply 1, 2 or 3 for details.`;
}

export function formatGapMessage(ctx: FinalizeContext): string {
  if (ctx.cards.length === 0) return '';
  const best = ctx.cards[0];
  const missing = best.match.missing_labels.slice(0, 3);
  const providers = best.pathway.training_providers.slice(0, 2);
  const hasMissing = missing.length > 0;
  const hasProviders = providers.length > 0;

  const lines: string[] = [];
  lines.push(
    `For "${best.preferred_label}": ${best.match.matched} of ${best.match.total} skills ready.`,
  );
  if (hasMissing) {
    lines.push(`Still need: ${missing.join(', ')}.`);
  }
  if (hasProviders) {
    lines.push(`Local training: ${providers.join(', ')}.`);
  }
  return lines.join('\n');
}

export function formatRiskMessage(ctx: FinalizeContext): string {
  if (ctx.cards.length === 0) return '';
  const best = ctx.cards[0];
  const pct = Math.round(best.risk.breakdown.near_term_displacement_risk * 100);
  const countryName = COUNTRIES[ctx.country].name;
  const verdict =
    pct < 30 ? 'low' : pct < 60 ? 'medium' : 'high';
  const msg =
    `AI exposure (${countryName}): ${pct}% — ${verdict} risk over 10 years.\n` +
    `Calibrated for local broadband and routine-task mix.` +
    (ctx.profileUrl ? `\nFull passport: ${ctx.profileUrl}` : '');
  return msg.trim();
}

// Full reply bundle, used by the webhook + the /sms-demo page.
export function formatFinalMessages(ctx: FinalizeContext): string[] {
  return [
    formatSkillsMessage(ctx),
    formatJobsMessage(ctx),
    formatGapMessage(ctx),
    formatRiskMessage(ctx),
  ].filter((s) => s.length > 0);
}

// Detail reply when the user texts "1"/"2"/"3" after receiving the jobs list.
export function formatJobDetail(
  card: OpportunityCard,
  country: CountryCode,
): string {
  const pct = Math.round((card.match.matched / Math.max(1, card.match.total)) * 100);
  const risk = Math.round(card.risk.breakdown.near_term_displacement_risk * 100);
  const currency = COUNTRIES[country].currencyLabel;
  const wage = card.signals.wage
    ? `${card.signals.wage.mean_monthly} ${currency}/mo`
    : 'wage data n/a';
  const growth =
    card.signals.growth.yoy_pct != null
      ? `${card.signals.growth.yoy_pct}% YoY sector growth`
      : 'growth n/a';
  const missing = card.match.missing_labels.slice(0, 3).join(', ') || 'none';
  return (
    `${card.preferred_label}\n` +
    `Match: ${pct}% · Pay: ${wage} · ${growth}\n` +
    `AI risk: ${risk}%\n` +
    `Missing skills: ${missing}.`
  );
}
