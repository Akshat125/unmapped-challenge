'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, Sparkles, ShieldCheck, Globe } from 'lucide-react';
import { COUNTRIES } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Entry flow (§7.1). Five questions, all skippable. Partial input is
// accepted by /api/skills-map and the mock will flag low-confidence
// responses (see lib/esco-mapper.ts + §7.1.2).
export default function EntryFlow() {
  const router = useRouter();
  const t = useT();
  const country = useProfile((s) => s.country);
  const answers = useProfile((s) => s.answers);
  const setAnswer = useProfile((s) => s.setAnswer);
  const setMapping = useProfile((s) => s.setMapping);
  const config = COUNTRIES[country];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/skills-map', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          education: answers.education,
          workText: answers.workText,
          toolsText: answers.toolsText,
          languages: answers.languages ?? [],
          aspirationsText: answers.aspirationsText,
        }),
      });
      const body = await res.json();
      if (!res.ok || body.status === 'upstream_error') {
        setError(t('entry.mapping_failed'));
        return;
      }
      setMapping(body);
      router.push('/profile');
    } catch {
      setError(t('entry.mapping_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  const toggleLanguage = (code: string) => {
    const current = answers.languages ?? [];
    setAnswer(
      'languages',
      current.includes(code) ? current.filter((c) => c !== code) : [...current, code],
    );
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-ys-teal/10 px-3 py-1 text-xs font-medium text-ys-teal">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Your skills, made visible
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-wb-navy md:text-5xl">
            {t('entry.title')}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-wb-ink/70">
            {t('entry.subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-wb-ink/60">
            <span className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
              {t('entry.saving_locally')}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
              Portable · ISCO-08 grounded
            </span>
          </div>
        </div>
        <HeroIllustration />
      </section>

      <form onSubmit={onSubmit} className="space-y-6">
        <StepCard stepNumber={1} label={t('entry.q1_education')}>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {config.educationLevels.map((lvl) => {
              const checked = answers.education === lvl.id;
              return (
                <label
                  key={lvl.id}
                  className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                    checked
                      ? 'border-wb-navy bg-wb-navy/5 text-wb-navy font-medium'
                      : 'border-wb-line bg-white hover:border-wb-blue'
                  }`}
                >
                  <input
                    type="radio"
                    name="education"
                    value={lvl.id}
                    checked={checked}
                    onChange={() => setAnswer('education', lvl.id)}
                    className="h-4 w-4 accent-wb-navy"
                  />
                  <span>{lvl.localizedLabel ?? lvl.label}</span>
                </label>
              );
            })}
          </div>
          {answers.education && (
            <button
              type="button"
              className="mt-3 text-xs text-wb-ink/50 underline underline-offset-4 hover:text-wb-blue"
              onClick={() => setAnswer('education', undefined)}
            >
              {t('entry.skip')}
            </button>
          )}
        </StepCard>

        <StepCard stepNumber={2} label={t('entry.q2_work')}>
          <textarea
            className="mt-4 w-full min-h-[120px] rounded-lg border border-wb-line bg-white p-4 text-base focus:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue/20"
            placeholder={t('entry.q2_placeholder')}
            value={answers.workText ?? ''}
            onChange={(e) => setAnswer('workText', e.target.value)}
          />
        </StepCard>

        <StepCard stepNumber={3} label={t('entry.q3_tools')}>
          <textarea
            className="mt-4 w-full min-h-[90px] rounded-lg border border-wb-line bg-white p-4 text-base focus:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue/20"
            placeholder={t('entry.q3_placeholder')}
            value={answers.toolsText ?? ''}
            onChange={(e) => setAnswer('toolsText', e.target.value)}
          />
        </StepCard>

        <StepCard stepNumber={4} label={t('entry.q4_languages')}>
          <div className="mt-4 flex flex-wrap gap-2">
            {config.languages.map((lang) => {
              const checked = (answers.languages ?? []).includes(lang.code);
              return (
                <label
                  key={lang.code}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                    checked
                      ? 'border-wb-navy bg-wb-navy text-white'
                      : 'border-wb-line bg-white text-wb-ink hover:border-wb-blue'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleLanguage(lang.code)}
                  />
                  <Globe className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  <span>{lang.label}</span>
                </label>
              );
            })}
          </div>
        </StepCard>

        <StepCard stepNumber={5} label={t('entry.q5_aspirations')}>
          <textarea
            className="mt-4 w-full min-h-[90px] rounded-lg border border-wb-line bg-white p-4 text-base focus:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue/20"
            placeholder={t('entry.q5_placeholder')}
            value={answers.aspirationsText ?? ''}
            onChange={(e) => setAnswer('aspirationsText', e.target.value)}
          />
        </StepCard>

        {error && (
          <p className="rounded-lg border border-ys-amber bg-ys-amber/10 p-4 text-sm text-wb-ink">
            {error}
          </p>
        )}

        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-wb-line bg-white/95 p-4 shadow-lg backdrop-blur">
          <p className="mr-auto hidden text-sm text-wb-ink/60 md:block">
            You can skip any question. We'll flag a profile that needs more
            detail.
          </p>
          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            iconRight={ArrowRight}
          >
            {submitting ? t('entry.mapping_in_progress') : t('entry.finish')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function StepCard({
  stepNumber,
  label,
  children,
}: {
  stepNumber: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-wb-navy text-sm font-bold text-white"
        >
          {stepNumber}
        </span>
        <div className="flex-1">
          <legend className="text-lg font-semibold text-wb-navy">{label}</legend>
          {children}
        </div>
      </div>
    </Card>
  );
}

function HeroIllustration() {
  // Inline SVG, no external asset. Four user-group stream into a single
  // ISCO-08 node — literal visualization of the protocol claim.
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-wb-navy via-wb-navy to-wb-ink p-6 text-white shadow-xl">
      <svg
        viewBox="0 0 400 280"
        className="h-auto w-full"
        role="img"
        aria-label="Four user groups routed through a shared ISCO-08 taxonomy core"
      >
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#002244" />
            <stop offset="1" stopColor="#0B0F14" />
          </linearGradient>
          <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#00A499" stopOpacity="0.9" />
            <stop offset="1" stopColor="#00A499" stopOpacity="0.05" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="400" height="280" fill="url(#bg)" rx="12" />
        {/* Center hub */}
        <circle cx="200" cy="140" r="70" fill="url(#core)" />
        <circle cx="200" cy="140" r="36" fill="#00A499" opacity="0.25" />
        <circle cx="200" cy="140" r="16" fill="#00A499" />
        <text x="200" y="146" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700" letterSpacing="2">
          ISCO-08
        </text>
        {/* Connections */}
        {[
          { x: 60,  y: 60,  label: 'Youth' },
          { x: 340, y: 60,  label: 'Navigator' },
          { x: 60,  y: 220, label: 'Employer' },
          { x: 340, y: 220, label: 'Policymaker' },
        ].map((n) => (
          <g key={n.label}>
            <line
              x1={n.x}
              y1={n.y}
              x2={200}
              y2={140}
              stroke="#009FDF"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.55"
            />
            <circle cx={n.x} cy={n.y} r="20" fill="#ffffff" opacity="0.06" />
            <circle cx={n.x} cy={n.y} r="8" fill="#009FDF" />
            <text
              x={n.x}
              y={n.x === 60 ? n.y - 28 : n.y + 32}
              textAnchor="middle"
              fill="#F4F1EC"
              fontSize="11"
              fontWeight="600"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-4 text-sm leading-relaxed text-white/70">
        UNMAPPED is the shared taxonomy underneath every labor-market actor.
        One profile, every stakeholder.
      </p>
    </div>
  );
}
