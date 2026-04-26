'use client';

import Link from 'next/link';
import { useAggregate } from '@/lib/policymaker-client';
import { Stat } from '@/components/ui/Stat';

function KPICard({
  title,
  subtitle,
  primary,
  children,
}: {
  title: string;
  subtitle: string;
  primary: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-wb-navy bg-gradient-to-br from-wb-navy to-wb-ink p-5 text-white shadow-sm">
      <div className="text-xs uppercase tracking-widest text-white/60">{title}</div>
      <div className="mt-1 text-3xl font-bold text-ys-teal">{primary}</div>
      <p className="mt-1 text-xs text-white/80">{subtitle}</p>
      {children && <div className="mt-3 text-sm text-white/90">{children}</div>}
    </div>
  );
}

export default function PolicymakerHome() {
  const { data, loading, error } = useAggregate();

  if (loading && !data) return <p className="text-sm text-wb-ink/60">Loading…</p>;
  if (error || !data)
    return (
      <p className="rounded border border-ys-amber bg-ys-amber/10 p-3 text-sm text-wb-ink">
        Could not load aggregate data.
      </p>
    );

  const topHotspot = data.kpis.automation_hotspots[0];
  const topRoi = data.kpis.roi_on_training[0];
  const divergence = data.kpis.skill_divergence;

  return (
    <div>
      <header>
        <p className="text-xs uppercase tracking-widest text-wb-ink/60">
          National Human Capital Command Center
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-wb-navy">
          {data.country_name}
        </h1>
        <p className="mt-2 text-sm text-wb-ink/70">
          Macro workforce signals for strategic planning. Every figure is
          source-labeled. Numbers update instantly with the country switcher.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard
          title="Skill Divergence Index"
          subtitle={`Gap between today's 20-24 cohort and the ${divergence.target?.year ?? 2030} projected mix. Lower = better aligned.`}
          primary={divergence.index.toFixed(2)}
        >
          {divergence.current && divergence.target && (
            <ul className="text-xs text-white/70">
              <li>
                Today: tertiary {divergence.current.tertiary_pct}%, secondary{' '}
                {divergence.current.secondary_pct}%
              </li>
              <li>
                Target: tertiary {divergence.target.tertiary_pct}%, secondary{' '}
                {divergence.target.secondary_pct}%
              </li>
            </ul>
          )}
        </KPICard>
        <KPICard
          title="Automation Hotspot"
          subtitle="Sector with the highest routine-task density — this is where displacement lands first."
          primary={topHotspot?.sector ?? '—'}
        >
          {topHotspot && (
            <ul className="text-xs text-white/70">
              <li>routine density {topHotspot.routine_density.toFixed(2)}</li>
              <li>
                employment {topHotspot.employment_thousands_latest.toLocaleString()}k workers
              </li>
            </ul>
          )}
        </KPICard>
        <KPICard
          title="Top ROI on Training"
          subtitle="Wage uplift per skill-point gained. A training investment shortlist in one number."
          primary={
            topRoi
              ? `+${topRoi.roi_per_skill_point.toFixed(0)}% / pt`
              : '—'
          }
        >
          {topRoi && (
            <ul className="text-xs text-white/70">
              <li>sector: {topRoi.sector}</li>
              <li>
                wage uplift +{topRoi.wage_uplift_pct}% over {topRoi.skill_point_delta.toFixed(2)} skill-pt gain
              </li>
            </ul>
          )}
        </KPICard>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.wdi && (
          <>
            <Stat
              label="GDP per capita"
              value={`$${data.wdi.gdp_per_capita_usd.value.toLocaleString()}`}
              source={data.sources.wdi}
              year={data.wdi.gdp_per_capita_usd.year}
            />
            <Stat
              label="Labor-force participation"
              value={`${data.wdi.labor_force_participation_pct.value}%`}
              source={data.sources.wdi}
              year={data.wdi.labor_force_participation_pct.year}
            />
            <Stat
              label="Employment-to-population"
              value={`${data.wdi.employment_to_population_pct.value}%`}
              source={data.sources.wdi}
              year={data.wdi.employment_to_population_pct.year}
            />
            <Stat
              label="Youth NEET"
              value={`${data.wdi.youth_neet_pct.value}%`}
              source={data.sources.wdi}
              year={data.wdi.youth_neet_pct.year}
            />
          </>
        )}
        <Stat
          label="Mobile broadband"
          value={`${data.broadband_penetration_pct} / 100`}
          source="ITU Digital Development"
        />
        {data.wbes && (
          <>
            <Stat
              label="Unfilled vacancies"
              value={`${data.wbes.unfilled_vacancies_pct}%`}
              source={data.sources.wbes}
              year={data.wbes.survey_year}
            />
            <Stat
              label="Firms reporting skill shortage"
              value={`${data.wbes.inadequately_educated_workforce_major_constraint_pct}%`}
              source={data.sources.wbes}
              year={data.wbes.survey_year}
            />
            <Stat
              label="Firms offering training"
              value={`${data.wbes.firms_offering_formal_training_pct}%`}
              source={data.sources.wbes}
              year={data.wbes.survey_year}
            />
          </>
        )}
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/policymaker/skill-gaps"
          className="rounded border border-wb-line bg-white p-5 hover:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue shadow-sm"
        >
          <h3 className="text-lg font-semibold text-wb-navy">Skill-gap heatmap</h3>
          <p className="mt-2 text-sm text-wb-ink/70">
            Sector × occupation risk grid with per-occupation ILO task shares.
          </p>
        </Link>
        <Link
          href="/policymaker/sectors"
          className="rounded border border-wb-line bg-white p-5 hover:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue shadow-sm"
        >
          <h3 className="text-lg font-semibold text-wb-navy">Sector growth</h3>
          <p className="mt-2 text-sm text-wb-ink/70">
            Employment time-series, wage trends, and education premiums.
          </p>
        </Link>
        <Link
          href="/policymaker/invest"
          className="rounded border border-wb-line bg-white p-5 hover:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue shadow-sm"
        >
          <h3 className="text-lg font-semibold text-wb-navy">Investment prioritization</h3>
          <p className="mt-2 text-sm text-wb-ink/70">
            Adjustable-weight ranking with defended defaults. CSV export.
          </p>
        </Link>
        <Link
          href="/policymaker/config"
          className="rounded border border-wb-line bg-white p-5 hover:border-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue shadow-sm"
        >
          <h3 className="text-lg font-semibold text-wb-navy">White-label configuration</h3>
          <p className="mt-2 text-sm text-wb-ink/70">
            Localize UNMAPPED for your country — no code changes.
          </p>
        </Link>
      </section>
    </div>
  );
}
