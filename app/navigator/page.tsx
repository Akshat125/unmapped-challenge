'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useNavigatorStore } from '@/lib/navigator-store';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';

export default function NavigatorCaseload() {
  const profiles = useNavigatorStore((s) => s.profiles);
  const addProfile = useNavigatorStore((s) => s.addProfile);
  const removeProfile = useNavigatorStore((s) => s.removeProfile);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    displayName: '',
    country: 'GH' as CountryCode,
    workText: '',
    toolsText: '',
  });

  const statusCounts = {
    intake: profiles.filter((p) => p.status === 'intake').length,
    training: profiles.filter((p) => p.status === 'training').length,
    placed: profiles.filter((p) => p.status === 'placed').length,
    paused: profiles.filter((p) => p.status === 'paused').length,
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.displayName) return;
    addProfile(draft);
    setDraft({ displayName: '', country: 'GH', workText: '', toolsText: '' });
    setOpen(false);
  }

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Caseload</h1>
          <p className="mt-1 text-sm text-neutral-700">
            Profiles you manage on behalf of youth without devices. Validations
            you record here travel with the profile when it's exported.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded bg-ink px-4 py-2 text-sm text-white"
        >
          {open ? 'Cancel' : 'Add intake'}
        </button>
      </header>

      <section className="mt-4 grid grid-cols-4 gap-3 text-sm">
        <Tile label="Intake" value={statusCounts.intake} />
        <Tile label="In training" value={statusCounts.training} />
        <Tile label="Placed" value={statusCounts.placed} />
        <Tile label="Paused" value={statusCounts.paused} />
      </section>

      {open && (
        <form
          onSubmit={submit}
          className="mt-6 space-y-3 rounded border border-neutral-300 bg-white p-4"
        >
          <label className="block">
            <span className="text-sm font-medium">Display name (or alias)</span>
            <input
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Country</span>
            <select
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value as CountryCode })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
            >
              {(Object.keys(COUNTRIES) as CountryCode[])
                .filter((c) => COUNTRIES[c].active)
                .map((c) => (
                  <option key={c} value={c}>
                    {COUNTRIES[c].name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Work they've done</span>
            <textarea
              value={draft.workText}
              onChange={(e) => setDraft({ ...draft, workText: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
              rows={2}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Tools / software</span>
            <textarea
              value={draft.toolsText}
              onChange={(e) => setDraft({ ...draft, toolsText: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2"
              rows={2}
            />
          </label>
          <button type="submit" className="rounded bg-ink px-4 py-2 text-sm text-white">
            Create profile
          </button>
        </form>
      )}

      {profiles.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
          No profiles yet. Add your first intake with the button above.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="rounded border border-neutral-300 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{p.displayName}</h3>
                  <p className="text-xs text-neutral-500">
                    {COUNTRIES[p.country].name} · created{' '}
                    {new Date(p.createdAt).toLocaleDateString()} · status {p.status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    href={`/navigator/${p.id}`}
                    className="rounded border border-ink bg-white px-3 py-1"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => removeProfile(p.id)}
                    className="rounded border border-red-400 bg-white px-3 py-1 text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {p.workText && (
                <p className="mt-2 text-sm text-neutral-800">
                  <em>&ldquo;{p.workText}&rdquo;</em>
                </p>
              )}
              <div className="mt-2 text-xs text-neutral-600">
                {p.validations.length} validation{p.validations.length === 1 ? '' : 's'} ·{' '}
                {p.localPathways.length} local pathway
                {p.localPathways.length === 1 ? '' : 's'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-neutral-300 bg-white p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
