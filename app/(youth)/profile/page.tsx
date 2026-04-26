'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/lib/profile-store';
import { useT } from '@/lib/i18n';
import { useCatalog } from '@/lib/catalog-client';
import { COUNTRIES } from '@/lib/config/countries';
import { buildYouthProfileV1 } from '@/lib/profile-v1-builder';
import type { OccupationRiskSummary } from '@/lib/profile-v1-builder';
import { encodeShareToken } from '@/lib/share-token';
import { QRCodeView } from '@/components/QRCodeView';
import { ProfilePassportView } from '@/components/ProfilePassportView';
import { BackButton } from '@/components/ui/BackButton';
import type { OpportunityCard } from '@/app/api/match/route';

// "My Digital Skill Passport" — the Youth view per V3.0 §3 Group 1.
export default function ProfilePage() {
  const t = useT();
  const country = useProfile((s) => s.country);
  const answers = useProfile((s) => s.answers);
  const mapping = useProfile((s) => s.mapping);
  const mappedAt = useProfile((s) => s.mappedAt);
  const catalog = useCatalog();

  const [risks, setRisks] = useState<OccupationRiskSummary[]>([]);
  const [shareOpen, setShareOpen] = useState(false);

  // Hydrate the risk_profile field in the exported V1 by hitting /api/match.
  useEffect(() => {
    if (!mapping) return;
    fetch('/api/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ country, profileSkillUris: mapping.esco_skills }),
    })
      .then((r) => r.json())
      .then((body: { cards: OpportunityCard[] }) => {
        setRisks(
          body.cards.map((c) => ({
            isco_code: c.isco_code,
            base_exposure: c.risk.breakdown.long_term_risk,
            calibrated_risk: c.risk.breakdown.near_term_displacement_risk,
            skill_complexity_score: c.risk.breakdown.skill_complexity_score,
            infrastructure_delay_factor: c.risk.breakdown.infrastructure_delay_factor,
          })),
        );
      })
      .catch(() => void 0);
  }, [country, mapping]);

  const profileV1 = useMemo(() => {
    if (!mapping || !catalog) return null;
    return buildYouthProfileV1(
      { country, answers, mapping, createdAt: mappedAt ?? undefined },
      {
        catalogSkills: catalog.skills,
        catalogOccupations: catalog.occupations,
        risks,
      },
    );
  }, [country, answers, mapping, mappedAt, catalog, risks]);

  function downloadJson() {
    if (!profileV1) return;
    const blob = new Blob([JSON.stringify(profileV1, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmapped-profile-${country}-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Share: encode the full profile to a URL fragment.
  const shareArtifacts = useMemo(() => {
    if (!profileV1) return null;
    const { token, size, truncated } = encodeShareToken(profileV1);
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://unmapped.example';
    const url = `${base}/share/${token}`;
    return { url, size, truncated };
  }, [profileV1]);

  if (!mapping) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t('profile.heading')}</h1>
        <p className="text-neutral-700">{t('profile.no_skills_yet')}</p>
        <Link href="/entry" className="inline-block rounded bg-wb-navy px-5 py-2 text-white hover:bg-wb-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2">
          {t('profile.edit')}
        </Link>
      </div>
    );
  }

  const flagged = mapping.status === 'flagged_low_confidence';
  const educationLabel = COUNTRIES[country].educationLevels.find(
    (l) => l.id === answers.education,
  );

  return (
    <article>
      <BackButton href="/entry" label="Back to your story" className="mb-4" />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">My Digital Skill Passport</h1>
          <p className="mt-1 text-neutral-700">
            A portable, owned, verifiable record of what you can do.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Schema: <code>unmapped.profile/v1</code> · {COUNTRIES[country].name}
            {educationLabel ? ` · ${educationLabel.localizedLabel ?? educationLabel.label}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => setShareOpen((v) => !v)}
            className="min-h-[44px] rounded bg-ink px-4 py-2 font-medium text-white"
          >
            {shareOpen ? 'Close share' : 'Share with employer'}
          </button>
          <button
            onClick={() => window.print()}
            className="min-h-[44px] rounded border border-ink bg-white px-4 py-2 font-medium"
          >
            {t('profile.print')}
          </button>
          <button
            onClick={downloadJson}
            className="min-h-[44px] rounded border border-ink bg-white px-4 py-2 font-medium"
          >
            {t('profile.export_json')}
          </button>
          <Link
            href="/opportunities"
            className="min-h-[44px] inline-flex items-center rounded border border-ink bg-white px-4 py-2 font-medium"
          >
            {t('profile.see_opportunities')}
          </Link>
        </div>
      </header>

      {flagged && (
        <p className="mt-4 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>{t('profile.flagged_title')}</strong>
          {mapping.message ? ' — ' + mapping.message : ''}
        </p>
      )}

      {shareOpen && shareArtifacts && (
        <section className="mt-6 rounded border border-neutral-300 bg-neutral-50 p-4 print:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
            Share with employer
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            Temporary read-only link. Employer opens in their browser or scans
            the QR.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="text-xs text-neutral-600">Link</label>
              <input
                readOnly
                value={shareArtifacts.url}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 font-mono text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(shareArtifacts.url)}
                  className="rounded bg-ink px-3 py-1 text-sm text-white"
                >
                  Copy link
                </button>
                <a
                  href={shareArtifacts.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-ink bg-white px-3 py-1 text-sm"
                >
                  Preview
                </a>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Payload size {shareArtifacts.size} chars
                {shareArtifacts.truncated
                  ? ' — too long for QR scanning; use the link instead.'
                  : ''}
              </p>
            </div>
            {!shareArtifacts.truncated && (
              <div className="flex flex-col items-center">
                <QRCodeView data={shareArtifacts.url} size={192} />
                <p className="mt-2 text-xs text-neutral-600">Scan to open</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-6 rounded border border-neutral-300 bg-white p-5">
        {profileV1 ? (
          <ProfilePassportView
            profile={profileV1}
            showSubjectIdentity={false}
            explanations={mapping?.explanations}
            hideTaxonomyCodes
          />
        ) : (
          <p className="text-sm text-neutral-600">Loading passport…</p>
        )}
      </section>

      <details className="mt-6 rounded border border-neutral-300 bg-white p-4 print:hidden">
        <summary className="cursor-pointer text-sm font-medium">
          For systems: raw JSON-LD ({profileV1?.schema ?? 'loading…'})
        </summary>
        <p className="mt-2 text-sm text-neutral-600">
          Employers, training providers, and governments can consume this
          document directly — it's the contract documented on the{' '}
          <Link href="/integrate" className="underline">
            Integration Reference
          </Link>
          .
        </p>
        {profileV1 && (
          <pre className="mt-3 max-h-80 overflow-auto rounded bg-neutral-50 p-3 text-xs">
            {JSON.stringify(profileV1, null, 2)}
          </pre>
        )}
      </details>
    </article>
  );
}
