'use client';

import { useMemo, useState } from 'react';
import { useAggregate } from '@/lib/policymaker-client';
import { iscoToSector } from '@/lib/sector-map';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Color ramp for near-term displacement risk. Intentionally stops short of
// white at 0% so a "0 risk" cell still reads as data-present. Accessible-
// ish (contrast-aware) but not a replacement for proper palette work.
function riskColor(risk: number): string {
  const r = Math.round(255 * Math.min(1, risk * 1.1));
  const g = Math.round(210 * (1 - risk));
  const b = Math.round(140 * (1 - risk));
  return `rgb(${r}, ${g}, ${b})`;
}

type RiskKey = 'near_term_risk' | 'long_term_risk';

export default function SkillGapsPage() {
  const { data, loading, error } = useAggregate();
  const [metric, setMetric] = useState<RiskKey>('near_term_risk');

  const rows = useMemo(() => {
    if (!data) return [];
    return [...data.occupation_risks]
      .map((r) => ({ ...r, sector: iscoToSector(r.isco_code) }))
      .sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  const sectorRows = useMemo(() => {
    if (!rows.length) return [];
    const bySector = new Map<string, typeof rows>();
    for (const r of rows) {
      const bucket = bySector.get(r.sector) ?? [];
      bucket.push(r);
      bySector.set(r.sector, bucket);
    }
    return Array.from(bySector.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  function downloadCsv() {
    if (!data) return;
    const header = [
      'country',
      'sector',
      'isco_code',
      'occupation',
      'long_term_risk',
      'near_term_risk',
      'routine_share',
      'routine_share_source',
    ];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [
          data.country,
          r.sector.replace(/,/g, ';'),
          r.isco_code,
          r.preferred_label.replace(/,/g, ';'),
          r.long_term_risk.toFixed(3),
          r.near_term_risk.toFixed(3),
          r.routine_share.toFixed(3),
          r.routine_share_source,
        ].join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmapped-skill-gaps-${data.country}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <p className="text-sm text-wb-ink/60">Loading…</p>;
  if (error || !data)
    return (
      <p className="rounded border border-ys-amber bg-ys-amber/10 p-3 text-sm text-wb-ink">
        Could not load aggregate data.
      </p>
    );

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-wb-navy">Skill-gap heatmap · {data.country_name}</h1>
          <p className="mt-2 text-sm text-wb-ink/70">
            Occupation-level risk, grouped by ILOSTAT sector. Darker cells =
            higher {metric === 'near_term_risk' ? 'near-term displacement' : 'long-term automation'} risk.
            Hover a row for the underlying numbers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-wb-ink">
            Metric:{' '}
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as RiskKey)}
              className="rounded border border-wb-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wb-blue ml-2"
            >
              <option value="near_term_risk">Near-term (LMIC-calibrated)</option>
              <option value="long_term_risk">Long-term (Frey-Osborne raw)</option>
            </select>
          </label>
          <Button
            onClick={downloadCsv}
            variant="secondary"
          >
            Export CSV
          </Button>
        </div>
      </header>

      <section className="mt-8 space-y-8">
        {sectorRows.map(([sector, rows]) => (
          <div key={sector}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-wb-ink/70">
              {sector}
            </h2>
            <Card className="mt-3 overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-wb-sand text-left text-xs uppercase tracking-wide text-wb-ink/60 border-b border-wb-line">
                    <tr>
                      <th className="px-4 py-3">Occupation</th>
                      <th className="px-4 py-3">ISCO</th>
                      <th className="px-4 py-3">Long-term</th>
                      <th className="px-4 py-3">Near-term</th>
                      <th className="px-4 py-3">Routine share</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wb-line">
                    {rows.map((r) => (
                      <tr key={r.isco_code}>
                        <td className="px-4 py-3 font-medium text-wb-navy">{r.preferred_label}</td>
                        <td className="px-4 py-3 text-xs text-wb-ink/60">{r.isco_code}</td>
                        <td className="px-4 py-3">{Math.round(r.long_term_risk * 100)}%</td>
                        <td
                          className="px-4 py-3 font-semibold text-wb-ink"
                          style={{ backgroundColor: riskColor(r.near_term_risk) }}
                        >
                          {Math.round(r.near_term_risk * 100)}%
                        </td>
                        <td className="px-4 py-3">{r.routine_share.toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-wb-ink/60">
                          {r.routine_share_source === 'ilo_fow_per_occupation'
                            ? 'ILO FoW (per-occupation)'
                            : 'Country constant'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ))}
      </section>

      <footer className="mt-8 text-xs text-wb-ink/50">
        Sources: {data.sources.ilo_fow} · {data.sources.frey_osborne} · ITU
        broadband ({data.broadband_penetration_pct}%).
      </footer>
    </div>
  );
}
