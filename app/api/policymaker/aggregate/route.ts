import { NextResponse } from 'next/server';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import {
  getEmployment,
  getEarningsBySector,
  getEarningsByEducation,
  yoyGrowthPct,
} from '@/lib/data-loaders/ilostat';
import { getWbes } from '@/lib/data-loaders/wbes';
import { getWdi } from '@/lib/data-loaders/wdi';
import { getWittgenstein, attainmentDelta } from '@/lib/data-loaders/wittgenstein';
import { tertiaryPremium } from '@/lib/returns-to-education';
import { getEscoOccupations } from '@/lib/data-loaders/esco';
import { getFowForCountry } from '@/lib/data-loaders/ilo-fow';
import { calibrateRisk } from '@/lib/risk-calibration';
import {
  skillDivergenceIndex,
  automationHotspots,
  roiOnTraining,
} from '@/lib/human-capital-kpis';
import { iscoToSector } from '@/lib/sector-map';

// GET /api/policymaker/aggregate?country=GH
// Returns the data envelope all three policymaker pages consume. Computed
// server-side so the dashboard stays fast on 3G and every source label is
// available to the UI without extra fetches.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = (url.searchParams.get('country') as CountryCode) ?? 'GHA';
  const config = COUNTRIES[country];
  if (!config) {
    return NextResponse.json({ error: 'unknown_country' }, { status: 400 });
  }

  const [
    employment,
    earnings,
    earningsEdu,
    wbes,
    wdi,
    wittgenstein,
    escoOcc,
    fow,
  ] = await Promise.all([
    getEmployment(country),
    getEarningsBySector(country),
    getEarningsByEducation(country),
    getWbes(country),
    getWdi(country),
    getWittgenstein(country),
    getEscoOccupations(),
    getFowForCountry(country),
  ]);

  // Unique sectors present in the employment seed
  const sectors = Array.from(new Set(employment.value.map((r) => r.sector)));

  // Per-sector aggregates
  const sectorAggregates = sectors.map((sector) => {
    const rows = employment.value.filter((r) => r.sector === sector);
    const latest = rows.sort((a, b) => b.year - a.year)[0];
    const prev = rows.sort((a, b) => b.year - a.year)[1];
    const growth = yoyGrowthPct(employment.value, sector);
    const wage = earnings.value[sector] ?? null;
    const premium = tertiaryPremium(earningsEdu.value, sector);
    return {
      sector,
      employment_thousands_latest: latest?.employment_thousands ?? null,
      employment_thousands_prev: prev?.employment_thousands ?? null,
      series: rows,
      yoy_growth_pct: growth,
      wage,
      premium,
    };
  });

  // Per-occupation risk — shows the sectoral/occupational heatmap on /skill-gaps
  const occupationRisks = escoOcc.value.map((occ) => {
    const tc = fow.value.byIsco.get(occ.isco_code);
    const breakdown = calibrateRisk(occ.frey_osborne_raw ?? 0, config, {
      occupationRoutineShare: tc?.routine_share,
      cognitiveShare: tc?.cognitive_share,
      manualShare: tc?.manual_share,
      usRoutineWeightedMean: fow.value.usRoutineWeightedMean,
    });
    return {
      isco_code: occ.isco_code,
      preferred_label: occ.preferred_label,
      long_term_risk: breakdown.long_term_risk,
      near_term_risk: breakdown.near_term_displacement_risk,
      final_risk_v3: breakdown.final_risk_v3,
      skill_complexity_score: breakdown.skill_complexity_score,
      routine_share: tc?.routine_share ?? config.routineTaskShare,
      routine_share_source:
        tc != null ? 'ilo_fow_per_occupation' : 'country_constant',
    };
  });

  const attainment = attainmentDelta(wittgenstein.value);

  // V3.0 Command Center KPIs.
  const divergence = skillDivergenceIndex(wittgenstein.value);
  const hotspots = automationHotspots(
    sectorAggregates,
    occupationRisks.map((o) => ({
      isco_code: o.isco_code,
      sector: iscoToSector(o.isco_code),
      routine_share: o.routine_share,
    })),
  );
  const roi = roiOnTraining(sectorAggregates, hotspots);

  return NextResponse.json({
    country,
    country_name: config.name,
    currency_label: config.currencyLabel,
    broadband_penetration_pct: config.broadbandPenetration,
    sources: {
      employment: employment.source,
      earnings: earnings.source,
      earnings_by_education: earningsEdu.source,
      wbes: wbes.source,
      wdi: wdi.source,
      wittgenstein: wittgenstein.source,
      ilo_fow: fow.source,
      frey_osborne: 'Frey & Osborne (2013)',
    },
    sectors: sectorAggregates,
    occupation_risks: occupationRisks,
    wbes: wbes.value,
    wdi: wdi.value,
    wittgenstein: {
      rows: wittgenstein.value,
      attainment,
    },
    kpis: {
      skill_divergence: divergence,
      automation_hotspots: hotspots,
      roi_on_training: roi,
    },
  });
}
