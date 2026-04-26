'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/lib/profile-store';
import { useT } from '@/lib/i18n';
import type { OpportunityCard } from '@/app/api/match/route';
import { OpportunityCardView } from '@/components/OpportunityCardView';
import { BackButton } from '@/components/ui/BackButton';
import { LinkButton } from '@/components/ui/LinkButton';

interface MatchResponse {
  country: string;
  cards: OpportunityCard[];
  country_name: string;
  currency_label: string;
}

export default function OpportunitiesPage() {
  const t = useT();
  const country = useProfile((s) => s.country);
  const mapping = useProfile((s) => s.mapping);

  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            country,
            profileSkillUris: mapping?.esco_skills ?? [],
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as MatchResponse;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [country, mapping]);

  if (!mapping) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-wb-navy">{t('opportunities.heading')}</h1>
        <p className="text-base leading-relaxed text-wb-ink/70">{t('opportunities.no_results')}</p>
        <LinkButton href="/entry">{t('nav.entry')}</LinkButton>
      </div>
    );
  }

  return (
    <div>
      <BackButton href="/profile" label="Back to your profile" className="mb-4" />
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-wb-navy">
          {t('opportunities.heading')}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-wb-ink/70">
          {t('opportunities.subheading')}
        </p>
        {data && (
          <p className="mt-2 text-xs text-wb-ink/50">
            {data.country_name} · {data.cards.length} matches
          </p>
        )}
      </header>

      {loading && !data && (
        <p className="mt-6 text-sm text-wb-ink/60">{t('entry.mapping_in_progress')}</p>
      )}
      {error && (
        <p className="mt-6 rounded border border-ys-amber bg-ys-amber/10 p-3 text-sm text-wb-ink">
          {t('entry.mapping_failed')}
        </p>
      )}

      {data && data.cards.length === 0 && (
        <div className="mt-8 space-y-4">
          <p className="text-base leading-relaxed text-wb-ink/70">
            {t('opportunities.no_results')}
          </p>
          <LinkButton href="/entry">{t('profile.edit')}</LinkButton>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {data?.cards.map((card) => (
          <OpportunityCardView key={card.isco_code} card={card} countryCode={country} />
        ))}
      </div>
    </div>
  );
}
