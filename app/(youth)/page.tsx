'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';
import { useT } from '@/lib/i18n';

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
    <div>
      <h1 className="text-3xl font-semibold">{t('entry.title')}</h1>
      <p className="mt-2 text-neutral-700">{t('entry.subtitle')}</p>
      <p className="mt-1 text-sm text-neutral-500">{t('entry.saving_locally')}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <fieldset>
          <legend className="text-lg font-medium">{t('entry.q1_education')}</legend>
          <div className="mt-3 space-y-2">
            {config.educationLevels.map((lvl) => (
              <label
                key={lvl.id}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-neutral-300 bg-white px-4 py-2"
              >
                <input
                  type="radio"
                  name="education"
                  value={lvl.id}
                  checked={answers.education === lvl.id}
                  onChange={() => setAnswer('education', lvl.id)}
                  className="h-5 w-5"
                />
                <span>{lvl.localizedLabel ?? lvl.label}</span>
              </label>
            ))}
            {answers.education && (
              <button
                type="button"
                className="text-xs text-neutral-500 underline"
                onClick={() => setAnswer('education', undefined)}
              >
                {t('entry.skip')}
              </button>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-medium">{t('entry.q2_work')}</legend>
          <textarea
            className="mt-3 w-full min-h-[120px] rounded border border-neutral-300 bg-white p-3"
            placeholder={t('entry.q2_placeholder')}
            value={answers.workText ?? ''}
            onChange={(e) => setAnswer('workText', e.target.value)}
          />
        </fieldset>

        <fieldset>
          <legend className="text-lg font-medium">{t('entry.q3_tools')}</legend>
          <textarea
            className="mt-3 w-full min-h-[80px] rounded border border-neutral-300 bg-white p-3"
            placeholder={t('entry.q3_placeholder')}
            value={answers.toolsText ?? ''}
            onChange={(e) => setAnswer('toolsText', e.target.value)}
          />
        </fieldset>

        <fieldset>
          <legend className="text-lg font-medium">{t('entry.q4_languages')}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {config.languages.map((lang) => {
              const checked = (answers.languages ?? []).includes(lang.code);
              return (
                <label
                  key={lang.code}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded border px-4 py-2 ${
                    checked ? 'border-ink bg-ink text-white' : 'border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleLanguage(lang.code)}
                  />
                  <span>{lang.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-lg font-medium">{t('entry.q5_aspirations')}</legend>
          <textarea
            className="mt-3 w-full min-h-[80px] rounded border border-neutral-300 bg-white p-3"
            placeholder={t('entry.q5_placeholder')}
            value={answers.aspirationsText ?? ''}
            onChange={(e) => setAnswer('aspirationsText', e.target.value)}
          />
        </fieldset>

        {error && (
          <p className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] rounded bg-ink px-6 py-3 font-medium text-white disabled:opacity-60"
          >
            {submitting ? t('entry.mapping_in_progress') : t('entry.finish')}
          </button>
        </div>
      </form>
    </div>
  );
}
