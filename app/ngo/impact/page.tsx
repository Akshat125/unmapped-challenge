'use client';

import { useMemo } from 'react';
import { useNgoStore } from '@/lib/ngo-store';
import { BackButton } from '@/components/ui/BackButton';

// V3.0 §3 Step 4 — Transition Monitoring. Shows how many "unmapped" profiles
// have moved into the "Discovery" phase for employers (= been exported).
// Also reports placement, validations, and average time in program.
export default function NgoImpact() {
  const profiles = useNgoStore((s) => s.profiles);

  const stats = useMemo(() => {
    const total = profiles.length;
    const placed = profiles.filter((p) => p.status === 'placed').length;
    const inTraining = profiles.filter((p) => p.status === 'training').length;
    const validations = profiles.reduce((n, p) => n + p.validations.length, 0);
    const pathways = profiles.reduce((n, p) => n + p.localPathways.length, 0);
    const exportedAtLeastOnce = profiles.filter((p) => (p.exports_count ?? 0) > 0).length;
    const totalExports = profiles.reduce((n, p) => n + (p.exports_count ?? 0), 0);

    const now = Date.now();
    const daysInProgram = profiles.map(
      (p) => (now - Date.parse(p.createdAt)) / (1000 * 60 * 60 * 24),
    );
    const avgDays = daysInProgram.length
      ? Math.round(daysInProgram.reduce((a, b) => a + b, 0) / daysInProgram.length)
      : 0;

    return {
      total,
      placed,
      inTraining,
      validations,
      pathways,
      avgDays,
      exportedAtLeastOnce,
      totalExports,
    };
  }, [profiles]);

  if (profiles.length === 0) {
    return (
      <div>
        <BackButton href="/ngo" label="Back to your youth" className="mb-4" />
        <p className="rounded border border-dashed border-wb-line bg-white p-6 text-center text-sm text-wb-ink/60">
          No caseload entries yet. Impact metrics will appear once you add intakes
          on the Your youth page.
        </p>
      </div>
    );
  }

  const discoveryRate =
    stats.total > 0 ? Math.round((100 * stats.exportedAtLeastOnce) / stats.total) : 0;
  const placementRate =
    stats.total > 0 ? Math.round((100 * stats.placed) / stats.total) : 0;

  return (
    <div>
      <BackButton href="/ngo" label="Back to your youth" className="mb-4" />
      <h1 className="text-2xl font-semibold">Impact &amp; transitions</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Aggregate outcomes across your caseload. Discovery = profiles exported
        into employer-ready JSON at least once. Placement = profiles whose
        status reached <strong>placed</strong>.
      </p>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Youth on caseload" value={stats.total} />
        <Card label="Moved into Discovery" value={stats.exportedAtLeastOnce} highlight />
        <Card label="Placed" value={stats.placed} highlight />
        <Card label="In training" value={stats.inTraining} />
        <Card label="Discovery rate" value={discoveryRate} suffix="%" />
        <Card label="Placement rate" value={placementRate} suffix="%" highlight />
        <Card label="Average days in program" value={stats.avgDays} suffix="d" />
        <Card label="Validations recorded" value={stats.validations} />
        <Card label="Local pathways logged" value={stats.pathways} />
        <Card label="Total profile exports" value={stats.totalExports} />
      </section>

      <section className="mt-8 rounded border border-neutral-300 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Transitions (last 10)
        </h2>
        <ul className="mt-2 divide-y divide-neutral-200 text-sm">
          {profiles
            .slice()
            .sort((a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt))
            .slice(0, 10)
            .map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span>{p.displayName}</span>
                <span className="text-xs text-neutral-500">
                  {p.status}
                  {(p.exports_count ?? 0) > 0 && ' · exported'}
                  {p.last_exported_at
                    ? ` (${new Date(p.last_exported_at).toLocaleDateString()})`
                    : ''}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  suffix = '',
  highlight = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded border p-3 text-center ${
        highlight ? 'border-emerald-400 bg-emerald-50' : 'border-neutral-300 bg-white'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${highlight ? 'text-emerald-900' : ''}`}>
        {value}
        {suffix}
      </div>
    </div>
  );
}
