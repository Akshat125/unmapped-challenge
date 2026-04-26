'use client';

import { useState } from 'react';
import {
  useEcosystemStore,
  ALL_SCOPES,
  type ApiScope,
} from '@/lib/ecosystem-store';
import { BackButton } from '@/components/ui/BackButton';

// V3.0 §4 Step 4 — API & Ecosystem Management. Tenant list, per-key scopes
// with rate limits, revoke + create, last-used + 24h request counts.
// Prototype storage is localStorage; production wires to IAM.

export default function EcosystemPage() {
  const keys = useEcosystemStore((s) => s.keys);
  const createKey = useEcosystemStore((s) => s.createKey);
  const revokeKey = useEcosystemStore((s) => s.revokeKey);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    tenant: '',
    label: '',
    scopes: ['read:catalog'] as ApiScope[],
    rate_limit_rpm: 60,
  });

  const activeKeys = keys.filter((k) => k.status === 'active');
  const totalRequests24h = activeKeys.reduce((n, k) => n + k.requests_24h, 0);

  function toggleScope(s: ApiScope) {
    setDraft((d) =>
      d.scopes.includes(s)
        ? { ...d, scopes: d.scopes.filter((x) => x !== s) }
        : { ...d, scopes: [...d.scopes, s] },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.tenant.trim() || !draft.label.trim() || draft.scopes.length === 0) return;
    createKey(draft);
    setDraft({ tenant: '', label: '', scopes: ['read:catalog'], rate_limit_rpm: 60 });
    setOpen(false);
  }

  return (
    <div>
      <BackButton href="/policymaker" label="Back to overview" className="mb-4" />
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">API &amp; ecosystem</h1>
          <p className="mt-1 text-sm text-neutral-700">
            Manage API keys for NGOs, training providers, and corporate partners
            consuming the UNMAPPED infrastructure.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded bg-ink px-4 py-2 text-sm text-white"
        >
          {open ? 'Cancel' : 'Issue new API key'}
        </button>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
        <Stat label="Active keys" value={activeKeys.length} />
        <Stat label="Revoked keys" value={keys.length - activeKeys.length} />
        <Stat label="24h requests" value={totalRequests24h.toLocaleString()} />
        <Stat
          label="Top tenant (24h)"
          value={
            activeKeys.length > 0
              ? [...activeKeys].sort((a, b) => b.requests_24h - a.requests_24h)[0].tenant
              : '—'
          }
        />
      </section>

      {open && (
        <form
          onSubmit={submit}
          className="mt-6 space-y-3 rounded border border-neutral-300 bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Tenant</span>
              <input
                value={draft.tenant}
                onChange={(e) => setDraft({ ...draft, tenant: e.target.value })}
                placeholder="e.g. SENAI Brasil"
                required
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Label</span>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. SENAI skills sync"
                required
                className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <span className="text-sm font-medium">Scopes</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {ALL_SCOPES.map((s) => {
                const on = draft.scopes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleScope(s)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      on
                        ? 'border-ink bg-ink text-white'
                        : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Rate limit (requests/min)</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={draft.rate_limit_rpm}
              onChange={(e) => setDraft({ ...draft, rate_limit_rpm: Number(e.target.value) })}
              className="mt-1 w-40 rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-ink px-4 py-2 text-sm text-white"
          >
            Create key
          </button>
        </form>
      )}

      <section className="mt-8 overflow-hidden rounded border border-neutral-300 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-3 py-2">Tenant</th>
              <th className="px-3 py-2">Label</th>
              <th className="px-3 py-2">Scopes</th>
              <th className="px-3 py-2">Rate limit</th>
              <th className="px-3 py-2">24h</th>
              <th className="px-3 py-2">Last used</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t border-neutral-200">
                <td className="px-3 py-2 font-medium">{k.tenant}</td>
                <td className="px-3 py-2 text-xs">
                  <div>{k.label}</div>
                  <div className="font-mono text-[10px] text-neutral-500">
                    {k.token_prefix}…
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">{k.rate_limit_rpm} rpm</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {k.requests_24h.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs text-neutral-600">
                  {k.last_used_at
                    ? new Date(k.last_used_at).toLocaleString()
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  {k.status === 'active' ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">
                      active
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs">
                      revoked
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {k.status === 'active' && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="text-xs text-red-700 underline"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-neutral-300 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
