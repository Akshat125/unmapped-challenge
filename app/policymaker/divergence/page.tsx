'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMarketSignalStore } from '@/lib/market-signal-store';
import { useNgoStore } from '@/lib/ngo-store';
import { useEmployerStore } from '@/lib/employer-store';
import { useCatalog } from '@/lib/catalog-client';
import type { SkillMapResult } from '@/lib/esco-mapper';
import { Card } from '@/components/ui/Card';
import { BackButton } from '@/components/ui/BackButton';

// Supply vs demand divergence heatmap (V3.0 §4 Step 2).
//
//   SUPPLY  — union of mapped skills across active caseload profiles
//             (navigator-managed + employer-side profile imports)
//   DEMAND  — union of JD-derived ESCO skills from the employer decoder
//
// The gap per skill = demand_count − supply_count. Positive gap = employers
// are asking for something the caseload doesn't have. Negative = oversupply.
//
// The prototype pulls supply/demand from localStorage stores for demo
// simplicity. Production wires to a server-side event log.

interface Row {
  skill_uri: string;
  label: string;
  supply: number;
  demand: number;
  gap: number;
}

export default function DivergencePage() {
  const catalog = useCatalog();
  const jds = useMarketSignalStore((s) => s.recentJds);
  const navigatorProfiles = useNgoStore((s) => s.profiles);
  const employerCandidates = useEmployerStore((s) => s.candidates);

  // Supply skills per navigator profile need a mapping. We re-run the mock
  // mapper for each profile through the API to keep it consistent with the
  // youth flow. Do it once per profile on mount.
  const [supplyByProfile, setSupplyByProfile] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const pending = navigatorProfiles.filter(
      (p) => !(p.id in supplyByProfile) && (p.workText || p.toolsText),
    );
    if (pending.length === 0) return;
    let cancelled = false;
    Promise.all(
      pending.map(async (p) => {
        const res = await fetch('/api/skills-map', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            education: p.education,
            workText: p.workText,
            toolsText: p.toolsText,
            languages: p.languages ?? [],
            aspirationsText: p.aspirationsText,
          }),
        });
        if (!res.ok) return [p.id, [] as string[]] as const;
        const body = (await res.json()) as SkillMapResult;
        return [p.id, body.esco_skills] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSupplyByProfile((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [navigatorProfiles, supplyByProfile]);

  const rows: Row[] = useMemo(() => {
    const labelByUri = new Map(catalog?.skills.map((s) => [s.uri, s.label]) ?? []);
    const supply = new Map<string, number>();
    const demand = new Map<string, number>();

    // Supply from navigator profiles
    for (const p of navigatorProfiles) {
      for (const uri of supplyByProfile[p.id] ?? []) {
        supply.set(uri, (supply.get(uri) ?? 0) + 1);
      }
    }
    // Supply from employer-imported candidates
    for (const c of employerCandidates) {
      for (const sig of c.profile.signals) {
        supply.set(sig.skill_code, (supply.get(sig.skill_code) ?? 0) + 1);
      }
    }
    // Demand from JDs
    for (const jd of jds) {
      for (const uri of jd.esco_skills) {
        demand.set(uri, (demand.get(uri) ?? 0) + 1);
      }
    }

    const keys = new Set<string>([...supply.keys(), ...demand.keys()]);
    return Array.from(keys)
      .map((uri) => ({
        skill_uri: uri,
        label: labelByUri.get(uri) ?? uri,
        supply: supply.get(uri) ?? 0,
        demand: demand.get(uri) ?? 0,
        gap: (demand.get(uri) ?? 0) - (supply.get(uri) ?? 0),
      }))
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }, [catalog, navigatorProfiles, supplyByProfile, employerCandidates, jds]);

  const maxSignal = Math.max(1, ...rows.flatMap((r) => [r.supply, r.demand]));

  if (rows.length === 0) {
    return (
      <div>
        <BackButton href="/policymaker" label="Back to overview" className="mb-4" />
        <header>
          <h1 className="text-2xl font-semibold text-wb-navy">Supply &amp; demand divergence</h1>
          <p className="mt-2 text-sm text-wb-ink/70">
            No signal yet. Build supply by adding navigator caseload profiles;
            build demand by running job descriptions through the employer
            decoder.
          </p>
        </header>
        <ul className="mt-8 space-y-3 text-sm text-wb-ink">
          <li>
            →{' '}
            <Link href="/ngo/bulk" className="underline hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
              Add youth profiles via bulk intake
            </Link>
          </li>
          <li>
            →{' '}
            <Link href="/employer/jd" className="underline hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
              Run job descriptions through the decoder
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div>
      <BackButton href="/policymaker" label="Back to overview" className="mb-4" />
      <header>
        <h1 className="text-2xl font-semibold text-wb-navy">Supply &amp; demand divergence</h1>
        <p className="mt-2 text-sm text-wb-ink/70">
          Gap per skill between what employers are looking for (demand) and
          what the caseload has (supply). Positive gap (amber) = under-supplied;
          negative (teal) = over-supplied.
        </p>
        <p className="mt-2 text-xs text-wb-ink/50">
          {rows.length} skills tracked · {jds.length} JDs ingested ·{' '}
          {navigatorProfiles.length + employerCandidates.length} profiles
        </p>
      </header>

      <Card className="mt-8 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-wb-sand text-left text-xs uppercase tracking-wide text-wb-ink/60 border-b border-wb-line">
              <tr>
                <th className="px-4 py-3">Skill (ESCO)</th>
                <th className="px-4 py-3">Supply</th>
                <th className="px-4 py-3">Demand</th>
                <th className="px-4 py-3">Gap</th>
                <th className="px-4 py-3 min-w-[200px]">Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-line">
              {rows.map((r) => {
                const supplyPct = (r.supply / maxSignal) * 100;
                const demandPct = (r.demand / maxSignal) * 100;
                const bg =
                  r.gap > 0
                    ? 'bg-ys-amber/5'
                    : r.gap < 0
                      ? 'bg-ys-teal/5'
                      : 'bg-white';
                return (
                  <tr key={r.skill_uri} className={bg}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-wb-navy">{r.label}</div>
                      <div className="text-[10px] text-wb-ink/50">{r.skill_uri}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-wb-ink">{r.supply}</td>
                    <td className="px-4 py-3 font-mono text-wb-ink">{r.demand}</td>
                    <td
                      className={`px-4 py-3 font-mono ${
                        r.gap > 0 ? 'text-ys-amber' : r.gap < 0 ? 'text-ys-teal' : 'text-wb-ink/50'
                      }`}
                    >
                      {r.gap > 0 ? `+${r.gap}` : r.gap}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded bg-wb-line">
                          <div
                            className="h-2 rounded bg-wb-blue"
                            style={{ width: `${supplyPct}%` }}
                            title={`Supply: ${r.supply}`}
                          />
                        </div>
                        <div className="h-2 w-full rounded bg-wb-line">
                          <div
                            className="h-2 rounded bg-ys-amber"
                            style={{ width: `${demandPct}%` }}
                            title={`Demand: ${r.demand}`}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <footer className="mt-6 flex flex-wrap gap-4 text-xs text-wb-ink/60">
        <span className="flex items-center gap-2">
          <span className="block h-2 w-4 rounded bg-wb-blue" /> supply
        </span>
        <span className="flex items-center gap-2">
          <span className="block h-2 w-4 rounded bg-ys-amber" /> demand
        </span>
      </footer>
    </div>
  );
}
