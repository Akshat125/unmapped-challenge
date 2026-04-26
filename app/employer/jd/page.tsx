'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useEmployerStore } from '@/lib/employer-store';
import { useCatalog } from '@/lib/catalog-client';
import { useMarketSignalStore } from '@/lib/market-signal-store';
import type { JdMapResult } from '@/lib/jd-mapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface RankedMatch {
  candidateId: string;
  displayName: string;
  country: string;
  verified: number;
  self: number;
  missing: number;
  score: number;
}

export default function EmployerJdIngestion() {
  const catalog = useCatalog();
  const candidates = useEmployerStore((s) => s.candidates);
  const recordJd = useMarketSignalStore((s) => s.recordJd);
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
          title={`Mapped to ESCO: ${label}`}
          className="bg-ys-teal/15 underline decoration-ys-teal decoration-solid px-1"
        >
          {t.slice(span.start, span.end)}
        </mark>,
      );
      cursor = span.end;
    });
    if (cursor < t.length) parts.push(t.slice(cursor));
    return <>{parts}</>;
  }, [result, skillLabelsByUri]);

  const rankedCandidates: RankedMatch[] = useMemo(() => {
    if (!result) return [];
    const wanted = new Set(result.esco_skills);
    return candidates
      .map((c) => {
        const signals = new Set(c.profile.signals.map((s) => s.skill_code));
        const verified = new Set(c.profile.verifications.map((v) => v.skill_code));
        let vCount = 0;
        let sCount = 0;
        let missing = 0;
        for (const uri of wanted) {
          if (verified.has(uri)) vCount += 1;
          else if (signals.has(uri)) sCount += 1;
          else missing += 1;
        }
        return {
          candidateId: c.id,
          displayName: c.profile.subject.display_name ?? 'Anonymous',
          country: c.profile.country,
          verified: vCount,
          self: sCount,
          missing,
          score: 2 * vCount + sCount,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [result, candidates]);

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold text-wb-navy">Job Description decoder</h1>
        <p className="mt-2 text-sm text-wb-ink/70">
          Paste a job description in plain language. We show you exactly how
          your text maps to ISCO-08 occupations and ESCO skills — then rank
          your shortlist against it.
        </p>
      </header>

      <Card className="mt-8">
        <label className="block text-sm font-medium text-wb-navy">Job description</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded border border-wb-line bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-wb-blue"
          placeholder="Need a reliable person for phone screen repairs and stock management…"
        />
        <Button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="mt-4 disabled:opacity-50"
        >
          {loading ? 'Mapping…' : 'Map to ISCO / ESCO'}
        </Button>
        {error && (
          <p className="mt-3 rounded border border-ys-coral bg-ys-coral/10 p-2 text-sm text-ys-coral">
            {error}
          </p>
        )}
      </Card>

      {result && (
        <>
          <Card className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
              Transparency view — how we read your JD
            </h2>
            <p className="mt-4 text-base leading-relaxed text-wb-ink">{highlighted}</p>
            <p className="mt-4 text-xs text-wb-ink/50">
              Mapping confidence {Math.round(result.confidence * 100)}% · highlights
              link to ESCO skill labels on hover.
            </p>
          </Card>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-wb-blue bg-wb-blue/5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-navy">
                Headline occupation (ISCO-08)
              </h3>
              {result.isco_top_occupation ? (
                <div className="mt-3">
                  <div className="text-lg font-semibold text-wb-navy">
                    {occLabelsByIsco.get(result.isco_top_occupation)?.preferred_label ??
                      result.isco_top_occupation}
                  </div>
                  <div className="text-xs text-wb-ink/70">
                    ISCO-08 {result.isco_top_occupation}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-wb-ink/70">
                  No ISCO occupation matched — try adding concrete tasks.
                </p>
              )}
            </Card>
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
                ESCO skills identified
              </h3>
              {result.esco_skills.length === 0 ? (
                <p className="mt-3 text-sm text-wb-ink/60">None detected.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {result.esco_skills.map((uri) => (
                    <li
                      key={uri}
                      className="rounded-full border border-wb-line bg-white px-3 py-1 text-xs text-wb-ink"
                    >
                      {skillLabelsByUri.get(uri) ?? uri}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <Card className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
              Why we chose these codes
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-wb-ink">
              {result.explanations.map((e) => (
                <li key={e.skill_uri}>
                  <span className="font-medium text-wb-navy">
                    {skillLabelsByUri.get(e.skill_uri) ?? e.skill_uri}
                  </span>{' '}
                  <span className="text-wb-ink/70">
                    — mapped because you wrote &ldquo;
                    <strong>{e.evidence}</strong>&rdquo;
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-wb-navy">Ranked candidates</h2>
            {candidates.length === 0 ? (
              <p className="mt-4 rounded border border-dashed border-wb-line bg-white p-6 text-center text-sm text-wb-ink/60">
                Your shortlist is empty. Drop profile JSONs on the{' '}
                <Link href="/employer" className="underline focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
                  Candidates
                </Link>{' '}
                page first.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {rankedCandidates.map((m) => (
                  <li
                    key={m.candidateId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-wb-line bg-white p-4 text-sm shadow-sm"
                  >
                    <div>
                      <div className="font-semibold text-wb-navy">{m.displayName}</div>
                      <div className="text-xs text-wb-ink/60 mt-1">
                        {m.country} · score{' '}
                        <span className="font-mono font-semibold">{m.score}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-ys-teal/15 px-2 py-1 text-ys-teal font-medium">
                        {m.verified} verified
                      </span>
                      <span className="rounded-full bg-wb-line px-2 py-1 text-wb-ink font-medium">
                        {m.self} self-reported
                      </span>
                      {m.missing > 0 && (
                        <span className="rounded-full bg-ys-amber/20 px-2 py-1 text-wb-ink font-medium">
                          {m.missing} missing
                        </span>
                      )}
                      <Link
                        href={`/employer/${encodeURIComponent(m.candidateId)}`}
                        className="rounded border border-wb-navy bg-white text-wb-navy hover:bg-wb-sand px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-wb-blue transition-none ml-2"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
