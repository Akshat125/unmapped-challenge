'use client';

import { useMemo } from 'react';
import type { ProfileV1 } from '@/lib/profile-schema';
import { useCatalog } from '@/lib/catalog-client';
import { COUNTRIES } from '@/lib/config/countries';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface Props {
  profile: ProfileV1;
  showSubjectIdentity?: boolean;
  explanations?: Array<{ skill_uri: string; evidence: string; source_field: string }>;
  /**
   * When true, every ISCO-08 / ESCO code is hidden from the surface.
   * Used on the Youth `/profile` ("Digital Skill Passport") view. The
   * Employer / Share views keep codes visible since those audiences
   * need the taxonomy.
   */
  hideTaxonomyCodes?: boolean;
}

export function ProfilePassportView({
  profile,
  showSubjectIdentity = true,
  explanations,
  hideTaxonomyCodes = false,
}: Props) {
  const catalog = useCatalog();
  const country = COUNTRIES[profile.country as keyof typeof COUNTRIES];

  const rows = useMemo(() => {
    const byUri = new Map(catalog?.skills.map((s) => [s.uri, s.label]) ?? []);
    const verificationByCode = new Map<string, ProfileV1['verifications']>();
    for (const v of profile.verifications) {
      const list = verificationByCode.get(v.skill_code) ?? [];
      list.push(v);
      verificationByCode.set(v.skill_code, list);
    }
    const explanationByCode = new Map(
      (explanations ?? []).map((e) => [e.skill_uri, e]),
    );
    return profile.signals.map((s) => ({
      code: s.skill_code,
      label: byUri.get(s.skill_code) ?? s.task_description ?? s.skill_code,
      confidence: s.confidence,
      verifications: verificationByCode.get(s.skill_code) ?? [],
      explanation: explanationByCode.get(s.skill_code),
    }));
  }, [catalog, profile, explanations]);

  const occupationLabels = useMemo(() => {
    const byIsco = new Map(catalog?.occupations.map((o) => [o.isco_code, o]) ?? []);
    return profile.isco_occupations
      .map((code) => byIsco.get(code))
      .filter((o): o is NonNullable<typeof o> => !!o);
  }, [catalog, profile]);

  const highestRisk = profile.risk_profile[0];
  const verifiedCount = profile.verifications.length;

  return (
    <article className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div>
        <header>
          <div className="text-xs uppercase tracking-widest text-wb-ink/60">
            Digital Skill Passport · {profile.schema}
          </div>
          <h2 className="mt-1 text-2xl font-semibold text-wb-navy">
            {profile.subject.display_name && showSubjectIdentity
              ? profile.subject.display_name
              : 'Skill profile'}
          </h2>
          <p className="mt-1 text-sm text-wb-ink/70">
            {country?.name ?? profile.country} ·{' '}
            {profile.subject.education ?? 'education not stated'} ·{' '}
            {profile.subject.languages?.join(', ') ?? 'languages not stated'}
          </p>
        </header>

        {profile.subject.self_report.work_text && (
          <blockquote className="mt-4 border-l-4 border-wb-line pl-3 text-sm italic text-wb-ink/80">
            &ldquo;{profile.subject.self_report.work_text}&rdquo;
          </blockquote>
        )}

        <section className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
            Skills
          </h3>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-wb-ink/60">
              No skills mapped in this profile.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map((r) => {
                const verified = r.verifications.length > 0;
                return (
                  <li
                    key={r.code}
                    className={`rounded border p-3 ${
                      verified
                        ? 'border-ys-teal bg-white'
                        : 'border-wb-line bg-wb-sand'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium flex items-center gap-2">
                        {verified ? (
                          <span aria-hidden className="text-ys-teal font-bold">✓</span>
                        ) : (
                          <span aria-hidden className="text-wb-ink/50 font-bold">−</span>
                        )}
                        {r.label}
                      </span>
                      {!hideTaxonomyCodes && (
                        <span className="text-xs text-wb-ink/50">{r.code}</span>
                      )}
                    </div>
                    {verified ? (
                      <ul className="mt-2 space-y-1 text-xs text-wb-ink">
                        {r.verifications.map((v, i) => (
                          <li key={i}>
                            <strong>{v.method}</strong> · {v.navigator_name}
                            {' · '}
                            {new Date(v.date).toLocaleDateString()}
                            <span className="ml-1 text-ys-teal font-mono">
                              sig {v.signature.slice(0, 8)}…
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-wb-ink/60">
                        Self-reported · confidence{' '}
                        {Math.round(r.confidence * 100)}%
                      </p>
                    )}
                    {r.explanation && (
                      <p className="mt-2 text-xs italic text-wb-ink/50">
                        Mapped from {r.explanation.source_field}: &ldquo;{r.explanation.evidence}&rdquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {occupationLabels.length > 0 && (
          <section className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
              {hideTaxonomyCodes ? 'Jobs that fit your skills' : 'Matched occupations (ISCO-08)'}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {occupationLabels.slice(0, 8).map((o) => (
                <li key={o.isco_code} className="flex items-baseline gap-2">
                  <span className="font-medium">{o.preferred_label}</span>
                  {!hideTaxonomyCodes && (
                    <span className="text-xs text-wb-ink/50">ISCO-08 {o.isco_code}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wide text-wb-ink/60">
            Profile identity
          </div>
          <div className="mt-1 font-mono text-[11px] text-wb-ink break-all">
            {profile.core.id}
          </div>
          <div className="mt-2 text-xs text-wb-ink/60">
            Issued {new Date(profile.core.timestamp).toLocaleDateString()} ·{' '}
            {profile.core.standard}
          </div>
        </Card>

        <Card className="p-4 border-ys-teal bg-ys-teal/5">
          <div className="text-xs uppercase tracking-wide text-ys-teal">
            Navigator verifications
          </div>
          <div className="mt-1 text-2xl font-bold text-ys-teal">
            {verifiedCount}
          </div>
          <p className="mt-2 text-xs text-wb-ink/80">
            Each has a signature recoverable from the navigator&apos;s ID + skill + method + date + note.
          </p>
          {profile.navigator && (
            <p className="mt-2 text-xs text-wb-ink">
              Mediated by <strong>{profile.navigator.name}</strong>
            </p>
          )}
        </Card>

        {highestRisk && (
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wide text-wb-ink/60">
              Risk (primary occupation)
            </div>
            <div className="mt-2 text-sm space-y-1">
              <div>Long-term: {Math.round(highestRisk.base_exposure * 100)}%</div>
              <div>Near-term: {Math.round(highestRisk.calibrated_risk * 100)}%</div>
              <div>
                Skill complexity: {Math.round(highestRisk.skill_complexity_score * 100)}
              </div>
            </div>
            <p className="mt-3 text-xs text-wb-ink/50">
              Last calibrated {new Date(highestRisk.last_calc_date).toLocaleDateString()}
            </p>
          </Card>
        )}
      </aside>
    </article>
  );
}
