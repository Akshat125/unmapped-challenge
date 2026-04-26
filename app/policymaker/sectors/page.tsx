'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAggregate } from '@/lib/policymaker-client';
import { Card } from '@/components/ui/Card';

// Sector time-series page. Recharts is tree-shakeable per spec §4.
// Single chart with one line per sector; clicking the legend toggles.

const COLORS = [
  '#002244',
  '#009FDF',
  '#00A499',
  '#F4B400',
  '#E2553C',
  '#4BA6DF',
  '#0B0F14',
  '#D9DCE0',
];

export default function SectorsPage() {
  const { data, loading, error } = useAggregate();

  const chartData = useMemo(() => {
    if (!data) return [];
    const years = new Set<number>();
    data.sectors.forEach((s) => s.series.forEach((r) => years.add(r.year)));
    return Array.from(years)
      .sort()
      .map((year) => {
        const row: Record<string, number | null> = { year };
        data.sectors.forEach((s) => {
          const entry = s.series.find((r) => r.year === year);
          row[s.sector] = entry?.employment_thousands ?? null;
        });
        return row;
      });
  }, [data]);

  if (loading && !data) return <p className="text-sm text-wb-ink/60">Loading…</p>;
  if (error || !data)
    return (
      <p className="rounded border border-ys-amber bg-ys-amber/10 p-3 text-sm text-wb-ink">
        Could not load aggregate data.
      </p>
    );

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold text-wb-navy">Sector growth · {data.country_name}</h1>
        <p className="mt-2 text-sm text-wb-ink/70">
          Employment levels (thousands) and wage trends per sector. Use this
          page to identify sectors that warrant training investment.
        </p>
      </header>

      <Card className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
          Employment by sector (thousands)
        </h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#D9DCE0" />
              <XAxis dataKey="year" stroke="#0B0F14" fontSize={12} />
              <YAxis stroke="#0B0F14" fontSize={12} />
              <Tooltip />
              <Legend />
              {data.sectors.map((s, i) => (
                <Line
                  key={s.sector}
                  type="monotone"
                  dataKey={s.sector}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-xs text-wb-ink/50">Source: {data.sources.employment}</p>
      </Card>

      <Card className="mt-8 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-wb-sand text-left text-xs uppercase tracking-wide text-wb-ink/60 border-b border-wb-line">
              <tr>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Latest employment (k)</th>
                <th className="px-4 py-3">YoY growth</th>
                <th className="px-4 py-3">Mean monthly wage</th>
                <th className="px-4 py-3">Tertiary premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-line">
              {data.sectors.map((s) => (
                <tr key={s.sector}>
                  <td className="px-4 py-3 font-medium text-wb-navy">{s.sector}</td>
                  <td className="px-4 py-3 text-wb-ink">{s.employment_thousands_latest ?? '—'}</td>
                  <td className="px-4 py-3 text-wb-ink">
                    {s.yoy_growth_pct != null
                      ? `${s.yoy_growth_pct > 0 ? '+' : ''}${s.yoy_growth_pct}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-wb-ink">
                    {s.wage
                      ? `${s.wage.mean_monthly.toLocaleString()} ${s.wage.currency}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-wb-ink">
                    {s.premium ? `+${s.premium.premiumPct}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <footer className="mt-8 text-xs text-wb-ink/50">
        Sources: {data.sources.employment} · {data.sources.earnings} ·{' '}
        {data.sources.earnings_by_education}
      </footer>
    </div>
  );
}
