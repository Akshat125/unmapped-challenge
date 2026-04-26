'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useEmployerStore } from '@/lib/employer-store';
import { useCatalog } from '@/lib/catalog-client';
import { BackButton } from '@/components/ui/BackButton';

// Skill-first search. The employer types the skills they need. We rank
// candidates by verified matches first, self-reported matches second. No
// degree filters anywhere on the surface — the spec's value prop.

export default function EmployerSearch() {
  const candidates = useEmployerStore((s) => s.candidates);
  const catalog = useCatalog();
  const [query, setQuery] = useState('');

  const skillOptions = useMemo(() => catalog?.skills ?? [], [catalog]);
  const [selected, setSelected] = useState<string[]>([]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skillOptions.slice(0, 8);
    return skillOptions
      .filter((s) => s.label.toLowerCase().includes(q) || s.uri.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, skillOptions]);

  const ranked = useMemo(() => {
    if (selected.length === 0) return [];
    return candidates
      .map((c) => {
        const signalSet = new Set(c.profile.signals.map((s) => s.skill_code));
        const verifiedSet = new Set(c.profile.verifications.map((v) => v.skill_code));
        let verified = 0;
        let self = 0;
        const missing: string[] = [];
        for (const uri of selected) {
          if (verifiedSet.has(uri)) verified += 1;
          else if (signalSet.has(uri)) self += 1;
          else missing.push(uri);
        }
        const score = 2 * verified + self;
        return { candidate: c, verified, self, missing, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [candidates, selected]);

  function toggle(uri: string) {
    setSelected((curr) => (curr.includes(uri) ? curr.filter((u) => u !== uri) : [...curr, uri]));
  }

  return (
    <div>
      <BackButton href="/employer" label="Back to Step 1" className="mb-4" />
      <header>
        <h1 className="text-2xl font-semibold">Skill-first search</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Select the skills you need. We rank your shortlist by verified
          matches first (2× weight), then self-reported matches (1× weight).
          No credential filters.
        </p>
      </header>

      <section className="mt-6 rounded border border-neutral-300 bg-white p-4">
        <label className="text-sm font-medium">Search skills</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. soldering, JavaScript, customer communication"
          className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredOptions.map((s) => {
            const on = selected.includes(s.uri);
            return (
              <button
                key={s.uri}
                onClick={() => toggle(s.uri)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  on
                    ? 'border-ink bg-ink text-white'
                    : 'border-neutral-300 bg-white text-neutral-800'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <p className="mt-3 text-xs text-neutral-600">
            Searching for {selected.length} skill{selected.length === 1 ? '' : 's'}.{' '}
            <button onClick={() => setSelected([])} className="underline">
              Clear
            </button>
          </p>
        )}
      </section>

      <section className="mt-6">
        {candidates.length === 0 && (
          <p className="rounded border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
            Your candidate shortlist is empty. Drop profiles on the Candidates
            page first.
          </p>
        )}
        {candidates.length > 0 && selected.length === 0 && (
          <p className="rounded border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
            Pick skills above to rank {candidates.length} candidate
            {candidates.length === 1 ? '' : 's'}.
          </p>
        )}
        {ranked.length > 0 && (
          <ul className="space-y-3">
            {ranked.map(({ candidate, verified, self, missing, score }) => (
              <li key={candidate.id} className="rounded border border-neutral-300 bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">
                      {candidate.profile.subject.display_name ?? 'Anonymous'}
                    </h3>
                    <p className="text-xs text-neutral-600">
                      {candidate.profile.country} · score{' '}
                      <span className="font-mono font-semibold">{score}</span>
                    </p>
                  </div>
                  <Link
                    href={`/employer/${encodeURIComponent(candidate.id)}`}
                    className="rounded border border-ink bg-white px-3 py-1 text-sm"
                  >
                    Open
                  </Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
                    {verified} verified
                  </span>
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-neutral-800">
                    {self} self-reported
                  </span>
                  {missing.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                      {missing.length} missing
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
