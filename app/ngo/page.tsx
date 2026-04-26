'use client';

import { useState } from 'react';
import { useNgoStore } from '@/lib/ngo-store';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { Plus, X } from 'lucide-react';

export default function NgoCaseload() {
  const profiles = useNgoStore((s) => s.profiles);
  const addProfile = useNgoStore((s) => s.addProfile);
  const removeProfile = useNgoStore((s) => s.removeProfile);

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
          <h1 className="text-3xl font-bold tracking-tight text-wb-navy">Your youth</h1>
          <p className="mt-2 text-base leading-relaxed text-wb-ink/70">
            Profiles you manage on behalf of youth without devices.
            Validations you record here travel with the profile when it&rsquo;s
            exported.
          </p>
        </div>
        <Button
          onClick={() => setOpen((v) => !v)}
          icon={open ? X : Plus}
        >
          {open ? 'Cancel' : 'Add intake'}
        </Button>
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
          className="mt-6 space-y-4 rounded-lg border border-wb-line bg-white p-6"
        >
          <label className="block">
            <span className="text-sm font-medium text-wb-navy">Display name (or alias)</span>
            <input
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className="mt-1 w-full rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-wb-navy">Country</span>
            <select
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value as CountryCode })}
              className="mt-1 w-full rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
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
            <span className="text-sm font-medium text-wb-navy">Work they&rsquo;ve done</span>
            <textarea
              value={draft.workText}
              onChange={(e) => setDraft({ ...draft, workText: e.target.value })}
              className="mt-1 w-full rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
              rows={2}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-wb-navy">Tools / software</span>
            <textarea
              value={draft.toolsText}
              onChange={(e) => setDraft({ ...draft, toolsText: e.target.value })}
              className="mt-1 w-full rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
              rows={2}
            />
          </label>
          <Button type="submit">Create profile</Button>
        </form>
      )}

      {profiles.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-wb-line bg-white p-6 text-center text-sm text-wb-ink/60">
          No profiles yet. Add your first intake with the button above.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-wb-line bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-wb-navy">{p.displayName}</h3>
                  <p className="text-xs text-wb-ink/60">
                    {COUNTRIES[p.country].name} · created{' '}
                    {new Date(p.createdAt).toLocaleDateString()} · status {p.status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <LinkButton
                    href={`/ngo/${p.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    Open
                  </LinkButton>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeProfile(p.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {p.workText && (
                <p className="mt-3 text-sm italic text-wb-ink/80">
                  &ldquo;{p.workText}&rdquo;
                </p>
              )}
              <div className="mt-2 text-xs text-wb-ink/60">
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
