'use client';

import type { OpportunityCard } from '@/app/api/match/route';
import type { EvidenceCitation } from '@/lib/skill-match';
import { Disclosure } from './ui/Disclosure';
import { useT } from '@/lib/i18n';

// "Why we recommended this" — the per-card transparency panel. Renders the
// blended ranker's three sub-scores with their concrete data references.
//
// Per spec the panel is *expanded by default* on the youth opportunity card:
// the user is told the automation risk and the references that justified
// the recommendation up front, not behind another click.

const COMPONENT_LABELS: Record<EvidenceCitation['component'], string> = {
  demand: 'opportunities.why_demand',
  skill: 'opportunities.why_skill',
  safety: 'opportunities.why_safety',
};

function ScoreBar({ value, weight }: { value: number; weight: number }) {
  const pct = Math.round(value * 100);
  const weighted = Math.round(value * weight * 100);
  return (
    <div className="mt-2">
      <div
        role="progressbar"
        aria-label={`Sub-score ${pct}%, weighted contribution ${weighted}%`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded bg-wb-sand"
      >
        <div
          className="h-full bg-wb-blue/80"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-wb-ink/60">
        <span>sub-score {pct}%</span>
        <span>× weight {Math.round(weight * 100)}% = {weighted}%</span>
      </div>
    </div>
  );
}

function CitationRow({ ref: c, label }: { ref: EvidenceCitation; label: string }) {
  const valueEntries = Object.entries(c.values).filter(([, v]) => v != null && v !== '');
  return (
    <div className="rounded border border-wb-line bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-wb-navy">{label}</h4>
        <span className="text-[11px] uppercase tracking-widest text-wb-ink/50">
          {c.component}
        </span>
      </div>
      <ScoreBar value={c.sub_score} weight={c.weight} />
      <p className="mt-3 text-sm text-wb-ink/80 leading-relaxed">{c.detail}</p>
      <div className="mt-3 grid grid-cols-1 gap-1 text-[11px] text-wb-ink/70 sm:grid-cols-2">
        {valueEntries.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <span className="font-medium text-wb-ink/60">{k.replace(/_/g, ' ')}</span>
            <span className="font-mono text-wb-ink">{String(v)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-wb-line pt-2 text-[11px] italic text-wb-ink/60">
        <div>{c.source}</div>
        <div className="font-mono not-italic text-wb-ink/50">{c.source_file}</div>
      </div>
    </div>
  );
}

export function WhyRecommended({ card }: { card: OpportunityCard }) {
  const t = useT();
  const refByComponent = new Map(card.references.map((r) => [r.component, r]));
  const order: Array<EvidenceCitation['component']> = ['demand', 'skill', 'safety'];

  const totalPct = Math.round(card.score.total * 100);

  // Plain-language risk summary — the user wants the automation risk shouted
  // up front. Pulls from the same RiskBreakdown used downstream.
  const nearTermPct = Math.round(card.risk.breakdown.near_term_displacement_risk * 100);
  const longTermPct = Math.round(card.risk.breakdown.long_term_risk * 100);

  return (
    <Disclosure
      summary={t('opportunities.why_heading')}
      variant="card"
      defaultOpen
      className="mt-5"
    >
      <div className="space-y-4">
        <p className="text-sm text-wb-ink/80">{t('opportunities.why_intro')}</p>

        <div className="rounded border border-wb-line bg-wb-sand/60 p-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-wb-navy">
              {t('opportunities.why_total')}
            </span>
            <span className="font-mono text-wb-navy">{totalPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white">
            <div
              className="h-full bg-wb-blue"
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-wb-ink/70">
            {`${t('opportunities.why_demand')}: ${Math.round(card.score.components.demand * 100)}% · `}
            {`${t('opportunities.why_skill')}: ${Math.round(card.score.components.skill * 100)}% · `}
            {`${t('opportunities.why_safety')}: ${Math.round(card.score.components.safety * 100)}%`}
          </div>
        </div>

        <div className="rounded border border-wb-line bg-white p-3">
          <h4 className="text-sm font-semibold text-wb-navy">
            Automation risk for this job
          </h4>
          <p className="mt-2 text-sm text-wb-ink/80 leading-relaxed">
            Frey & Osborne place the long-term automation probability at{' '}
            <span className="font-mono">{longTermPct}%</span>. After
            calibrating for local broadband and routine-task share, near-term
            local risk is{' '}
            <span className="font-mono">{nearTermPct}%</span>. The safety
            component below is the inverse of that near-term risk.
          </p>
          <div className="mt-2 text-[11px] italic text-wb-ink/60">
            {card.risk.source_near}
          </div>
        </div>

        <div className="space-y-3">
          {order.map((comp) => {
            const c = refByComponent.get(comp);
            if (!c) return null;
            return (
              <CitationRow
                key={comp}
                ref={c}
                label={t(COMPONENT_LABELS[comp])}
              />
            );
          })}
        </div>
      </div>
    </Disclosure>
  );
}
