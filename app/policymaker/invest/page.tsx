'use client';

import { useMemo, useState } from 'react';
import { useAggregate } from '@/lib/policymaker-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// §7.2 Investment Prioritization. Three weight sliders with the defended
// defaults in the spec (skill_gap=0.4, employment_growth=0.4, wage_floor=0.2).
// Scores normalize each input to 0..1 per-country before weighting.

interface Weights {
  skillGap: number;
  employmentGrowth: number;
  wageFloor: number;
}

const DEFAULTS: Weights = {
  skillGap: 0.4,
  employmentGrowth: 0.4,
  wageFloor: 0.2,
};

function normalize(vals: number[]): number[] {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max === min) return vals.map(() => 0.5);
  return vals.map((v) => (v - min) / (max - min));
}

export default function InvestPage() {
  const { data, loading, error } = useAggregate();
  const [weights, setWeights] = useState<Weights>({ ...DEFAULTS });

  const sum = weights.skillGap + weights.employmentGrowth + weights.wageFloor;

  const scored = useMemo(() => {
    if (!data) return [];

    const growthInputs = data.sectors.map((s) => s.yoy_growth_pct ?? 0);
    const wageInputs = data.sectors.map((s) => s.wage?.mean_monthly ?? 0);
    // Skill-gap proxy: national share of firms reporting inadequately
    // educated workforce constraint (WBES) — single country-level number,
    // so every sector gets the same signal. This is a deliberate honest
    // limit; the spec notes /about/limits should disclose it. When WBES
    // publishes per-sector breakdowns we can slot them in here.
    const gapInput = data.wbes?.inadequately_educated_workforce_major_constraint_pct ?? 0;

    const growthNorm = normalize(growthInputs);
    const wageNorm = normalize(wageInputs);
    const gapNorm = 1; // national constraint is the same across sectors

    const totalWeight = Math.max(0.0001, sum);
    return data.sectors.map((s, i) => {
      const score =
        (weights.skillGap * gapNorm +
          weights.employmentGrowth * growthNorm[i] +
          weights.wageFloor * wageNorm[i]) /
        totalWeight;
      return { ...s, investmentScore: score };
    }).sort((a, b) => b.investmentScore - a.investmentScore);
  }, [data, weights, sum]);

  function downloadCsv() {
    if (!data) return;
    const rows = [
      [
        'rank',
        'sector',
        'investment_score',
        'yoy_growth_pct',
        'wage_mean_monthly',
        'currency',
        'tertiary_premium_pct',
      ].join(','),
    ];
    scored.forEach((s, i) => {
      rows.push(
        [
          i + 1,
          s.sector.replace(/,/g, ';'),
          s.investmentScore.toFixed(3),
          s.yoy_growth_pct ?? '',
          s.wage?.mean_monthly ?? '',
          s.wage?.currency ?? '',
          s.premium?.premiumPct ?? '',
        ].join(','),
      );
    });
    const header = `# UNMAPPED investment prioritization — ${data.country_name}\n# weights: skill_gap=${weights.skillGap}, employment_growth=${weights.employmentGrowth}, wage_floor=${weights.wageFloor}\n# generated: ${new Date().toISOString()}\n`;
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmapped-invest-${data.country}.csv`;
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

  const isDefaults =
    weights.skillGap === DEFAULTS.skillGap &&
    weights.employmentGrowth === DEFAULTS.employmentGrowth &&
    weights.wageFloor === DEFAULTS.wageFloor;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold text-wb-navy">
          Investment prioritization · {data.country_name}
        </h1>
        <p className="mt-2 text-sm text-wb-ink/70">
          Rank sectors by combined skill-gap, employment-growth, and wage-floor
          scores. Weights are adjustable. Defaults come with a defense
          (hover the badge).
        </p>
      </header>

      <Card className="mt-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Slider
            label="Skill gap"
            value={weights.skillGap}
            onChange={(v) => setWeights((w) => ({ ...w, skillGap: v }))}
          />
          <Slider
            label="Employment growth"
            value={weights.employmentGrowth}
            onChange={(v) => setWeights((w) => ({ ...w, employmentGrowth: v }))}
          />
          <Slider
            label="Wage floor"
            value={weights.wageFloor}
            onChange={(v) => setWeights((w) => ({ ...w, wageFloor: v }))}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-wb-line pt-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium cursor-help ${
              isDefaults ? 'bg-ys-teal/15 text-ys-teal' : 'bg-wb-line text-wb-ink'
            }`}
            title="We weight skill gap and employment growth equally because filling current vacancies and anticipating future ones matter equally. Wage floor is secondary — it's a tiebreaker, not a primary investment criterion."
          >
            {isDefaults ? 'Using defended defaults' : 'Custom weights'}
            <span aria-hidden>ⓘ</span>
          </span>
          <Button
            onClick={() => setWeights({ ...DEFAULTS })}
            variant="secondary"
          >
            Reset to defaults
          </Button>
          <Button onClick={downloadCsv}>
            Export CSV brief
          </Button>
        </div>
      </Card>

      <Card className="mt-8 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-wb-sand text-left text-xs uppercase tracking-wide text-wb-ink/60 border-b border-wb-line">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">YoY growth</th>
                <th className="px-4 py-3">Wage</th>
                <th className="px-4 py-3">Tertiary premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-line">
              {scored.map((s, i) => (
                <tr key={s.sector}>
                  <td className="px-4 py-3 text-wb-ink/50">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-wb-navy">{s.sector}</td>
                  <td className="px-4 py-3 font-semibold text-wb-ink">
                    {(s.investmentScore * 100).toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-wb-ink">
                    {s.yoy_growth_pct != null ? `${s.yoy_growth_pct}%` : '—'}
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
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-wb-navy">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded-full"
          aria-label={label}
        />
        <span className="w-12 text-right font-mono text-sm text-wb-ink/70">{value.toFixed(2)}</span>
      </div>
    </label>
  );
}
