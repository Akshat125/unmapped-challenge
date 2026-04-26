'use client';

import type { OpportunityCard } from '@/app/api/match/route';
import { useT } from '@/lib/i18n';
import { buildRiskNarrative } from '@/lib/risk-narrative';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { RiskLens } from './RiskLens';
import { Disclosure } from './ui/Disclosure';
import { OpportunityTypeBadge } from './ui/OpportunityTypeBadge';

function Signal({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: string;
}) {
  return (
    <div className="rounded border border-wb-line bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-wb-ink/60">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-wb-navy">{value}</div>
      <div className="mt-1 text-[11px] italic text-wb-ink/50">{source}</div>
    </div>
  );
}

export function OpportunityCardView({
  card,
  countryCode,
}: {
  card: OpportunityCard;
  countryCode: string;
}) {
  const t = useT();
  const country = COUNTRIES[countryCode as CountryCode];
  const narrative = buildRiskNarrative(card.risk.breakdown, country?.name ?? 'your region');
  const emphasis = country?.opportunityEmphasis ?? 'formal_training';

  const bucketLabels: Record<string, string> = {
    basic: 'basic',
    secondary: 'secondary',
    tertiary: 'tertiary',
  };

  return (
    <article className="rounded-lg border border-wb-line bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <OpportunityTypeBadge
            iscoCode={card.isco_code}
            emphasis={emphasis}
            className="mb-3"
          />
          <h2 className="text-2xl font-semibold text-wb-navy">
            {card.preferred_label}
          </h2>
          <p className="mt-2 text-sm text-wb-ink/80">{card.plain_language}</p>
        </div>
      </header>

      {/* Match count — plain sentence, not formula. */}
      <section className="mt-5 rounded border border-wb-line bg-wb-sand/60 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-wb-navy">
            {t('opportunities.match_label')}
          </span>
          <span className="text-sm text-wb-ink/80">
            {t('opportunities.match_format')
              .replace('{matched}', String(card.match.matched))
              .replace('{total}', String(card.match.total))}
          </span>
        </div>
        {card.match.missing_labels.length > 0 && (
          <div className="mt-3 text-xs text-wb-ink/70">
            <span className="font-medium text-wb-ink">
              {t('opportunities.missing_label')}:
            </span>{' '}
            {card.match.missing_labels.join(', ')}
          </div>
        )}
      </section>

      {/* Plain-language risk paragraph — the default surface. */}
      <section className="mt-5 rounded border border-wb-line bg-white p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-wb-ink/60">
          How this job might change
        </div>
        <p className="mt-2 text-sm leading-relaxed text-wb-ink">
          {narrative.sentence}
        </p>
        <div className="mt-3 border-t border-wb-line pt-3">
          <Disclosure summary="Show how we calculated this" variant="default">
            <RiskLens risk={card.risk} countryCode={countryCode} />
          </Disclosure>
        </div>
      </section>

      {/* The three econometric signals. Source labels always visible. */}
      <section className="mt-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-wb-ink/60">
          {t('opportunities.signals_heading')}
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {card.signals.wage ? (
            <Signal
              label={t('opportunities.signal_wage')}
              value={`${card.signals.wage.mean_monthly.toLocaleString()} ${card.signals.wage.currency} / month (${card.signals.wage.year})`}
              source={card.signals.wage.source}
            />
          ) : (
            <Signal
              label={t('opportunities.signal_wage')}
              value="—"
              source="data not available for this sector"
            />
          )}
          <Signal
            label={t('opportunities.signal_growth')}
            value={
              card.signals.growth.yoy_pct != null
                ? `${card.signals.growth.yoy_pct > 0 ? '+' : ''}${card.signals.growth.yoy_pct}% YoY (${card.signals.growth.latest_year})`
                : '—'
            }
            source={card.signals.growth.source}
          />
          {card.signals.premium ? (
            <Signal
              label={t('opportunities.signal_premium')}
              value={`+${card.signals.premium.premium_pct}% (${bucketLabels[card.signals.premium.higherBucket]} vs ${bucketLabels[card.signals.premium.baseBucket]})`}
              source={card.signals.premium.source}
            />
          ) : (
            <Signal
              label={t('opportunities.signal_premium')}
              value="—"
              source="education breakdown not available for this sector"
            />
          )}
        </div>
      </section>

      {card.wittgenstein.implication && (
        <section className="mt-5 rounded border border-wb-line bg-wb-sand p-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-wb-navy/70">
            {t('opportunities.wittgenstein_heading')}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-wb-ink">
            {card.wittgenstein.implication.sentence}
          </p>
          <p className="mt-2 text-[11px] italic text-wb-ink/60">
            {card.wittgenstein.source}
          </p>
        </section>
      )}

      {card.pathway.training_providers.length > 0 && (
        <section className="mt-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-wb-ink/60">
            {t('opportunities.pathway_heading')}
          </h3>
          <p className="mt-2 text-sm text-wb-ink/80">
            {t('opportunities.pathway_providers')}:{' '}
            <span className="text-wb-ink">
              {card.pathway.training_providers.join(', ')}
            </span>
          </p>
        </section>
      )}

      {/* Standard code — hidden by default per spec rule for the Youth view. */}
      <div className="mt-5 border-t border-wb-line pt-4">
        <Disclosure summary="Show the standard occupation code" variant="default">
          <p className="font-mono text-xs text-wb-ink/80">
            ISCO-08 {card.isco_code}
          </p>
          <p className="mt-2 text-xs text-wb-ink/60">
            ISCO-08 is the international standard for occupation codes. It
            lets employers, ministries, and training providers speak the
            same language about jobs — across borders.
          </p>
        </Disclosure>
      </div>
    </article>
  );
}
