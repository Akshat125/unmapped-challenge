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

function riskBand(pct: number): { label: string; tone: 'low' | 'moderate' | 'high'; sentence: string } {
  if (pct < 20) {
    return {
      label: 'Low',
      tone: 'low',
      sentence: 'Most of the work in this occupation is hard to automate at today\u2019s state of the art.',
    };
  }
  if (pct < 50) {
    return {
      label: 'Moderate',
      tone: 'moderate',
      sentence: 'Parts of this occupation are routine enough that automation can chip away at hours over time.',
    };
  }
  if (pct < 75) {
    return {
      label: 'High',
      tone: 'high',
      sentence: 'A majority of the tasks in this occupation are technically automatable; expect job redesign.',
    };
  }
  return {
    label: 'Very high',
    tone: 'high',
    sentence: 'Most tasks in this occupation are technically automatable; the role is at risk of substitution.',
  };
}

const TONE_CLASSES: Record<'low' | 'moderate' | 'high', { bar: string; chip: string; bg: string }> = {
  low: {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-900',
    bg: 'bg-emerald-50/70 border-emerald-200',
  },
  moderate: {
    bar: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-900',
    bg: 'bg-amber-50/70 border-amber-200',
  },
  high: {
    bar: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-900',
    bg: 'bg-rose-50/70 border-rose-200',
  },
};

export function WhyRecommended({ card }: { card: OpportunityCard }) {
  const t = useT();
  const refByComponent = new Map(card.references.map((r) => [r.component, r]));
  const safetyRef = refByComponent.get('safety');
  const order: Array<EvidenceCitation['component']> = ['demand', 'skill', 'safety'];

  const totalPct = Math.round(card.score.total * 100);

  // Plain-language risk summary — the user wants the automation risk shouted
  // up front, with concrete numbers and the document references behind them.
  const nearTermPct = Math.round(card.risk.breakdown.near_term_displacement_risk * 100);
  const longTermPct = Math.round(card.risk.breakdown.long_term_risk * 100);
  const finalPct = Math.round(card.risk.breakdown.final_risk_v3 * 100);
  const band = riskBand(nearTermPct);
  const tone = TONE_CLASSES[band.tone];

  // FO resolution path lives on the safety citation values — when the
  // 4-digit ISCO match was missing we walked up the tree, and we surface
  // that here so the user sees exactly which ISCO bucket the probability
  // came from.
  const foProb = safetyRef?.values?.fo_prob as number | undefined;
  const resolutionLevel = safetyRef?.values?.resolution_level as number | undefined;
  const matchedPrefix = safetyRef?.values?.matched_isco_prefix as string | undefined;
  const fallback = safetyRef?.values?.fallback as string | undefined;
  const nSocs = safetyRef?.values?.n_socs as number | undefined;
  const topSocs = safetyRef?.values?.top_socs as string | undefined;

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

        {/* Automation-risk surface — always visible, never silent. The
            previous design fell to "0%" when the SOC↔ISCO crosswalk had no
            exact match; the resolver in scoreSafety now walks the ISCO tree
            so this paragraph cites a real Frey-Osborne probability for every
            occupation, with the exact ISCO bucket it came from. */}
        <div className={`rounded border p-3 ${tone.bg}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-wb-navy">
              {t('opportunities.automation_risk_heading')}
            </h4>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
              {band.label} · {nearTermPct}% near-term
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
            <div>
              <div className="font-semibold text-wb-ink/70">Long-term (Frey-Osborne raw)</div>
              <div className="font-mono text-wb-ink">{longTermPct}%</div>
            </div>
            <div>
              <div className="font-semibold text-wb-ink/70">Near-term (local)</div>
              <div className="font-mono text-wb-ink">{nearTermPct}%</div>
            </div>
            <div>
              <div className="font-semibold text-wb-ink/70">Final risk (V3.0)</div>
              <div className="font-mono text-wb-ink">{finalPct}%</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-wb-ink leading-relaxed">{band.sentence}</p>
          <p className="mt-2 text-sm text-wb-ink/80 leading-relaxed">
            Frey & Osborne place the global automation probability for this
            occupation at{' '}
            <span className="font-mono">{longTermPct}%</span>
            {foProb != null && (
              <>
                {' '}
                (raw <span className="font-mono">fo_prob = {foProb.toFixed(2)}</span>)
              </>
            )}
            . Calibrated for {card.risk.source_near.includes('broadband')
              ? card.risk.source_near
              : `local broadband and routine-task share (${card.risk.source_near})`}
            , the near-term local risk is{' '}
            <span className="font-mono">{nearTermPct}%</span> and the V3.0
            connectivity-adjusted final risk is{' '}
            <span className="font-mono">{finalPct}%</span>. Skill-overlap and
            country-demand are scored independently — you are not penalized
            for a high-risk role, you are told what the risk is.
          </p>

          {/* How the FO probability for THIS card was resolved — explicit so
              the user can see which row of frey_osborne.csv (and which ISCO
              bucket of it) justified the number. */}
          <div className="mt-3 rounded border border-white/60 bg-white/60 p-2 text-[11px] text-wb-ink/80">
            <div className="font-semibold text-wb-ink">How this number was resolved</div>
            {resolutionLevel === 4 && matchedPrefix && (
              <div>
                Exact match at ISCO-08 unit group{' '}
                <span className="font-mono">{matchedPrefix}</span>; employment-weighted across{' '}
                {nSocs ?? '?'} SOC code{(nSocs ?? 0) === 1 ? '' : 's'}
                {topSocs ? (
                  <>
                    {' '}
                    (<span className="font-mono">{topSocs}</span>)
                  </>
                ) : null}
                . Source: <span className="font-mono">data/frey_osborne.csv</span> via{' '}
                <span className="font-mono">scripts/data-prep/crosswalks/onet_soc_isco08.csv</span>.
              </div>
            )}
            {resolutionLevel != null && resolutionLevel < 4 && matchedPrefix && (
              <div>
                No 4-digit ISCO match in the SOC crosswalk; walked up to ISCO{' '}
                {resolutionLevel}-digit prefix{' '}
                <span className="font-mono">{matchedPrefix}</span> and used the
                employment-weighted average across that bucket. Source:{' '}
                <span className="font-mono">data/frey_osborne.csv</span> + ISCO-08 hierarchy in{' '}
                <span className="font-mono">public/data/frey_osborne_isco.json</span>.
              </div>
            )}
            {fallback === 'esco_occupations.frey_osborne_raw' && (
              <div>
                SOC↔ISCO crosswalk had no entry at any depth; used the
                ISCO-keyed seed value from{' '}
                <span className="font-mono">public/data/esco_occupations.json (frey_osborne_raw)</span>.
              </div>
            )}
            {fallback === 'country_routine_task_share' && (
              <div>
                No Frey-Osborne probability available at any aggregation
                level; substituted the {card.risk.source_near}. Treat the
                near-term number as a conservative country-level proxy.
              </div>
            )}
          </div>

          <div className="mt-2 text-[11px] italic text-wb-ink/60">
            {card.risk.source_long} · {card.risk.source_near}
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
