'use client';

import type { OpportunityCard } from '@/app/api/match/route';
import { useT } from '@/lib/i18n';
import { RiskLens } from './RiskLens';

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
    <div className="rounded border border-neutral-300 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-xs text-neutral-500">{source}</div>
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
  const bucketLabels: Record<string, string> = {
    basic: 'basic',
    secondary: 'secondary',
    tertiary: 'tertiary',
  };

  return (
    <article className="rounded-lg border border-neutral-300 bg-neutral-50 p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{card.preferred_label}</h2>
          <p className="text-sm text-neutral-700">{card.plain_language}</p>
        </div>
        <span className="text-xs text-neutral-500">ISCO-08 {card.isco_code}</span>
      </header>

      <div className="mt-4 rounded border border-neutral-300 bg-white p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{t('opportunities.match_label')}</span>
          <span className="text-sm">
            {t('opportunities.match_format')
              .replace('{matched}', String(card.match.matched))
              .replace('{total}', String(card.match.total))}
          </span>
        </div>
        {card.match.missing_labels.length > 0 && (
          <div className="mt-2 text-xs text-neutral-700">
            <span className="font-medium">{t('opportunities.missing_label')}:</span>{' '}
            {card.match.missing_labels.join(', ')}
          </div>
        )}
      </div>

      <section className="mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
          {t('opportunities.signals_heading')}
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
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

      <RiskLens risk={card.risk} countryCode={countryCode} />

      {card.wittgenstein.implication && (
        <section className="mt-4 rounded border border-indigo-300 bg-indigo-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
            {t('opportunities.wittgenstein_heading')}
          </h3>
          <p className="mt-2 text-sm text-indigo-950">
            {card.wittgenstein.implication.sentence}
          </p>
          <p className="mt-2 text-xs text-indigo-800">
            {card.wittgenstein.source}
          </p>
        </section>
      )}

      {card.pathway.training_providers.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
            {t('opportunities.pathway_heading')}
          </h3>
          <p className="mt-2 text-sm">
            {t('opportunities.pathway_providers')}:{' '}
            {card.pathway.training_providers.join(', ')}
          </p>
        </section>
      )}
    </article>
  );
}
