'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowDown, CheckCircle2, RefreshCcw, Wand2 } from 'lucide-react';
import { useEmployerStore } from '@/lib/employer-store';
import { useCatalog } from '@/lib/catalog-client';
import { useMarketSignalStore } from '@/lib/market-signal-store';
import type { JdMapResult } from '@/lib/jd-mapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { BackButton } from '@/components/ui/BackButton';

// Step 2 of the Employer wizard: "Here's what we understood."
//
// Transparency Breadcrumb:
//   [Your text with highlighted phrases]
//        ↓
//   [Detected skills as chips]
//        ↓
//   [Plain-language role name + ISCO disclosure]
//
// Two primary actions: "This is right" → Step 3 · "Let me try again" → reset.

export default function EmployerStep2() {
  const router = useRouter();
  const catalog = useCatalog();
  const recordJd = useMarketSignalStore((s) => s.recordJd);
  const candidates = useEmployerStore((s) => s.candidates);

  const [text, setText] = useState(
    'Need a reliable person for phone screen repairs and stock management.',
  );
  const [result, setResult] = useState<JdMapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/map-job-description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const parsed = (await res.json()) as JdMapResult;
      setResult(parsed);
      recordJd({
        text: parsed.input_text,
        esco_skills: parsed.esco_skills,
        isco_top: parsed.isco_top_occupation,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const skillLabelsByUri = useMemo(
    () => new Map(catalog?.skills.map((s) => [s.uri, s.label]) ?? []),
    [catalog],
  );
  const occLabelsByIsco = useMemo(
    () => new Map(catalog?.occupations.map((o) => [o.isco_code, o]) ?? []),
    [catalog],
  );

  const highlighted = useMemo(() => {
    if (!result) return null;
    const t = result.input_text;
    const spans = [...result.highlights];
    if (spans.length === 0) return <>{t}</>;
    const parts: Array<JSX.Element | string> = [];
    let cursor = 0;
    spans.forEach((span, i) => {
      if (span.start > cursor) parts.push(t.slice(cursor, span.start));
      const label = skillLabelsByUri.get(span.skill_uri) ?? span.skill_uri;
      parts.push(
        <mark
          key={i}
          title={`We mapped this to: ${label}`}
          className="rounded bg-ys-teal/20 px-1 py-0.5 underline decoration-ys-teal decoration-2 underline-offset-2"
        >
          {t.slice(span.start, span.end)}
        </mark>,
      );
      cursor = span.end;
    });
    if (cursor < t.length) parts.push(t.slice(cursor));
    return <>{parts}</>;
  }, [result, skillLabelsByUri]);

  const headlineRole = result?.isco_top_occupation
    ? occLabelsByIsco.get(result.isco_top_occupation)?.preferred_label ??
      'Standard role'
    : null;

  return (
    <div className="space-y-8">
      <BackButton href="/employer" label="Back to Step 1" />
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-wb-navy md:text-4xl">
          {result
            ? "Here's what we understood."
            : 'Describe the job in your own words.'}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-wb-ink/70">
          {result
            ? 'Check it. If anything is wrong, you can try again.'
            : "A few sentences is enough — we'll translate it to standard roles and show you exactly how."}
        </p>
      </header>

      {!result && (
        <Card className="max-w-3xl">
          <label htmlFor="jd-text" className="block text-sm font-semibold text-wb-navy">
            Job description
          </label>
          <textarea
            id="jd-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="mt-3 w-full rounded border border-wb-line bg-white p-4 text-base focus:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue/20"
            placeholder="e.g. Need a reliable person for phone screen repairs and stock management…"
          />
          {error && (
            <p className="mt-3 rounded border border-ys-coral bg-ys-coral/10 p-2 text-sm text-ys-coral">
              {error}
            </p>
          )}
          <div className="mt-4">
            <Button
              onClick={submit}
              disabled={loading || !text.trim()}
              icon={Wand2}
              className="disabled:opacity-50"
            >
              {loading ? 'Reading…' : 'See what we understood'}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <>
          {/* BREADCRUMB — Stage 1: raw text with highlights */}
          <Card className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
              What you wrote
            </p>
            <p className="mt-3 text-base leading-relaxed text-wb-ink">
              &ldquo;{highlighted}&rdquo;
            </p>
          </Card>

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-wb-ink/40" aria-hidden />
          </div>

          {/* BREADCRUMB — Stage 2: detected ESCO skills as chips */}
          <Card className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
              We spotted these skills
            </p>
            {result.esco_skills.length === 0 ? (
              <p className="mt-3 text-sm text-wb-ink/70">
                Nothing familiar yet. Try adding concrete tasks or tools.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {result.esco_skills.map((uri) => (
                  <li
                    key={uri}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ys-teal/40 bg-ys-teal/10 px-3 py-1 text-xs font-medium text-ys-teal"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {skillLabelsByUri.get(uri) ?? uri}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-wb-line pt-3">
              <Disclosure
                summary="Why these skills?"
                variant="default"
              >
                <ul className="space-y-1.5">
                  {result.explanations.map((e) => (
                    <li key={e.skill_uri}>
                      <span className="font-medium text-wb-navy">
                        {skillLabelsByUri.get(e.skill_uri) ?? e.skill_uri}
                      </span>{' '}
                      <span className="text-wb-ink/70">
                        — because you wrote &ldquo;<strong>{e.evidence}</strong>&rdquo;
                      </span>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            </div>
          </Card>

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-wb-ink/40" aria-hidden />
          </div>

          {/* BREADCRUMB — Stage 3: plain-language role + ISCO disclosure */}
          <Card className="max-w-3xl border-wb-navy bg-wb-navy/5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-navy/70">
              Which fits a standard role
            </p>
            {headlineRole ? (
              <>
                <h2 className="mt-3 text-2xl font-semibold text-wb-navy">
                  {headlineRole}
                </h2>
                {result.isco_top_occupation && (
                  <div className="mt-3">
                    <Disclosure
                      summary="Show the standard code"
                      variant="default"
                    >
                      <p className="font-mono text-xs text-wb-ink/80">
                        ISCO-08 {result.isco_top_occupation}
                      </p>
                      <p className="mt-2 text-xs text-wb-ink/60">
                        ISCO-08 is the international standard for occupation
                        codes used by ministries and statistics offices. Your
                        candidates speak the same vocabulary.
                      </p>
                    </Disclosure>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-wb-ink/70">
                No standard role matched your description — try adding more
                concrete tasks.
              </p>
            )}
          </Card>

          <div className="flex max-w-3xl flex-wrap gap-3 pt-2">
            <Button
              icon={CheckCircle2}
              onClick={() => router.push('/employer/candidates')}
              disabled={result.esco_skills.length === 0}
            >
              This is right — see who matches
            </Button>
            <Button
              icon={RefreshCcw}
              variant="secondary"
              onClick={() => setResult(null)}
            >
              Let me try again
            </Button>
            {candidates.length === 0 && (
              <p className="mt-2 basis-full text-xs text-wb-ink/60">
                You have no candidate profiles loaded yet. We&rsquo;ll open
                the import panel when you continue.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
