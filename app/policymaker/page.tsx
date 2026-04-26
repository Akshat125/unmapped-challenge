'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  GitCompareArrows,
  TrendingUp,
  Target,
  Grid3x3,
  SlidersHorizontal,
  Settings,
  Globe,
  DollarSign,
  Users,
  Briefcase,
  GraduationCap,
  Wifi,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { useAggregate } from '@/lib/policymaker-client';
import { Stat } from '@/components/ui/Stat';
import { Sparkline } from '@/components/ui/Sparkline';

function KPICard({
  title,
  subtitle,
  primary,
  icon: Icon,
  spark,
  children,
  accent = '#00A499',
}: {
  title: string;
  subtitle: string;
  primary: string;
  icon: LucideIcon;
  spark?: number[];
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-wb-navy/50 bg-gradient-to-br from-wb-navy to-wb-ink p-6 text-white shadow-lg">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-10"
        style={{ background: accent }} aria-hidden />
      <div className="flex items-start justify-between gap-4 relative">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {title}
          </div>
          <div className="mt-2 text-4xl font-bold tracking-tight" style={{ color: accent }}>
            {primary}
          </div>
        </div>
        {spark && spark.length > 1 && (
          <div className="mt-1 flex-shrink-0">
            <Sparkline
              values={spark}
              stroke={accent}
              fill={`${accent}22`}
              width={120}
              height={44}
            />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-white/70">{subtitle}</p>
      {children && <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/80">{children}</div>}
    </div>
  );
}

export default function PolicymakerHome() {
  const { data, loading, error } = useAggregate();

  if (loading && !data)
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-wb-ink/60">
        Loading signals…
      </div>
    );
  if (error || !data)
    return (
      <p className="rounded border border-ys-amber bg-ys-amber/10 p-4 text-sm text-wb-ink">
        Could not load aggregate data.
      </p>
    );

  const topHotspot = data.kpis.automation_hotspots[0];
  const topRoi = data.kpis.roi_on_training[0];
  const divergence = data.kpis.skill_divergence;

  // Sparkline series — built from real loaded data, not synthetic.
  const divergenceSpark = data.wittgenstein.rows.map((r) => r.tertiary_pct);
  const hotspotSectorSeries =
    data.sectors.find((s) => s.sector === topHotspot?.sector)?.series ?? [];
  const hotspotSpark = hotspotSectorSeries
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((r) => r.employment_thousands);
  const roiSectorSeries =
    data.sectors.find((s) => s.sector === topRoi?.sector)?.series ?? [];
  const roiSpark = roiSectorSeries
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((r) => r.employment_thousands);

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-wb-ink/50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ys-teal" aria-hidden />
          National Human Capital Command Center
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-wb-navy">
          {data.country_name}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-wb-ink/70">
          Macro workforce signals for strategic planning. Every figure is
          source-labeled. Numbers update instantly with the country switcher.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <KPICard
          title="Skill Divergence Index"
          subtitle={`Gap between today's 20-24 cohort and the ${divergence.target?.year ?? 2030} projected mix. Lower = better aligned.`}
          primary={divergence.index.toFixed(2)}
          icon={GitCompareArrows}
          spark={divergenceSpark}
          accent="#00A499"
        >
          {divergence.current && divergence.target && (
            <ul className="space-y-1">
              <li className="flex justify-between"><span>Today · tertiary</span><span className="font-mono">{divergence.current.tertiary_pct}%</span></li>
              <li className="flex justify-between"><span>{divergence.target.year} target · tertiary</span><span className="font-mono">{divergence.target.tertiary_pct}%</span></li>
            </ul>
          )}
        </KPICard>
        <KPICard
          title="Automation Hotspot"
          subtitle="Sector with the highest routine-task density — this is where displacement lands first."
          primary={topHotspot?.sector ?? '—'}
          icon={AlertTriangle}
          spark={hotspotSpark}
          accent="#F4B400"
        >
          {topHotspot && (
            <ul className="space-y-1">
              <li className="flex justify-between"><span>Routine density</span><span className="font-mono">{topHotspot.routine_density.toFixed(2)}</span></li>
              <li className="flex justify-between"><span>Employment (thousands)</span><span className="font-mono">{topHotspot.employment_thousands_latest.toLocaleString()}</span></li>
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
          icon={Target}
          spark={roiSpark}
          accent="#009FDF"
        >
          {topRoi && (
            <ul className="space-y-1">
              <li className="flex justify-between"><span>Sector</span><span className="font-mono">{topRoi.sector}</span></li>
              <li className="flex justify-between"><span>Wage uplift</span><span className="font-mono">+{topRoi.wage_uplift_pct}%</span></li>
            </ul>
          )}
        </KPICard>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-wb-ink/60">
          Context indicators
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {data.wdi && (
            <>
              <Stat
                icon={DollarSign}
                label="GDP per capita"
                value={`$${data.wdi.gdp_per_capita_usd.value.toLocaleString()}`}
                source={data.sources.wdi}
                year={data.wdi.gdp_per_capita_usd.year}
              />
              <Stat
                icon={Users}
                label="Labor-force participation"
                value={`${data.wdi.labor_force_participation_pct.value}%`}
                source={data.sources.wdi}
                year={data.wdi.labor_force_participation_pct.year}
              />
              <Stat
                icon={Briefcase}
                label="Employment-to-population"
                value={`${data.wdi.employment_to_population_pct.value}%`}
                source={data.sources.wdi}
                year={data.wdi.employment_to_population_pct.year}
              />
              <Stat
                icon={GraduationCap}
                label="Youth NEET"
                value={`${data.wdi.youth_neet_pct.value}%`}
                source={data.sources.wdi}
                year={data.wdi.youth_neet_pct.year}
              />
            </>
          )}
          <Stat
            icon={Wifi}
            label="Mobile broadband"
            value={`${data.broadband_penetration_pct} / 100`}
            source="ITU Digital Development"
          />
          {data.wbes && (
            <>
              <Stat
                icon={AlertTriangle}
                label="Unfilled vacancies"
                value={`${data.wbes.unfilled_vacancies_pct}%`}
                source={data.sources.wbes}
                year={data.wbes.survey_year}
              />
              <Stat
                icon={AlertTriangle}
                label="Skill-shortage firms"
                value={`${data.wbes.inadequately_educated_workforce_major_constraint_pct}%`}
                source={data.sources.wbes}
                year={data.wbes.survey_year}
              />
              <Stat
                icon={GraduationCap}
                label="Firms offering training"
                value={`${data.wbes.firms_offering_formal_training_pct}%`}
                source={data.sources.wbes}
                year={data.wbes.survey_year}
              />
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-wb-ink/60">
          Dive deeper
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { href: '/policymaker/skill-gaps', icon: Grid3x3, title: 'Skill-gap heatmap', desc: 'Sector × occupation risk grid with per-occupation ILO task shares.' },
            { href: '/policymaker/divergence', icon: GitCompareArrows, title: 'Supply vs demand', desc: 'Caseload mapped skills vs employer job-description signals.' },
            { href: '/policymaker/sectors', icon: TrendingUp, title: 'Sector growth', desc: 'Employment time-series, wage trends, and education premiums.' },
            { href: '/policymaker/invest', icon: SlidersHorizontal, title: 'Investment prioritization', desc: 'Adjustable-weight ranking with defended defaults. CSV export.' },
            { href: '/policymaker/config', icon: Settings, title: 'White-label configuration', desc: 'Localize UNMAPPED for your country — no code changes.' },
            { href: '/policymaker/ecosystem', icon: Globe, title: 'API & ecosystem', desc: 'Tenant-scoped API keys for NGOs, employers, and partners.' },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-lg border border-wb-line bg-white p-5 shadow-sm transition-all hover:border-wb-blue hover:shadow-md focus:outline-none focus:ring-2 focus:ring-wb-blue"
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-wb-blue" strokeWidth={1.75} aria-hidden />
                <ArrowUpRight className="h-4 w-4 text-wb-ink/30 transition-colors group-hover:text-wb-blue" aria-hidden />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-wb-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-wb-ink/70">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
