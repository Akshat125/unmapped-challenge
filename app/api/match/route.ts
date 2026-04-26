import { NextResponse } from 'next/server';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';
import { getJoinedOccupations } from '@/lib/data-loaders/joined';
import {
  getEmployment,
  getEarningsBySector,
  getEarningsByEducation,
  yoyGrowthPct,
} from '@/lib/data-loaders/ilostat';
import { getWittgenstein } from '@/lib/data-loaders/wittgenstein';
import { getFowForCountry } from '@/lib/data-loaders/ilo-fow';
import { rankMatches } from '@/lib/skill-match';
import { calibrateRisk, type RiskBreakdown } from '@/lib/risk-calibration';
import { tertiaryPremium } from '@/lib/returns-to-education';
import {
  buildImplication,
  iscoToSectorCategory,
  type Implication,
} from '@/lib/wittgenstein-implications';
import { iscoToSector } from '@/lib/sector-map';

// /api/match
// Input:  { country: CountryCode, profileSkillUris: string[] }
// Output: ranked opportunity cards, fully hydrated with signals + risk.
//
// Every number rendered in the UI comes from this endpoint, with a source
// label attached. Spec §D1: "Every econometric figure shown must have a
// visible source label."

export interface OpportunityCard {
  isco_code: string;
  preferred_label: string;
  plain_language: string;
  match: {
    matched: number;
    total: number;
    matched_uris: string[];
    missing_uris: string[];
    missing_labels: string[];
  };
  sector: string;
  signals: {
    wage: { mean_monthly: number; currency: string; year: number; source: string } | null;
    growth: { yoy_pct: number | null; latest_year: number | null; source: string };
    premium: {
      sector: string;
      baseBucket: 'basic' | 'secondary' | 'tertiary';
      higherBucket: 'basic' | 'secondary' | 'tertiary';
      premium_pct: number;
      source: string;
    } | null;
  };
  risk: {
    breakdown: RiskBreakdown;
    source_long: string;
    source_near: string;
  };
  wittgenstein: {
    implication: Implication | null;
    source: string;
  };
  pathway: {
    training_providers: string[];
  };
  onet_tasks: string[];
  source_trace: string[]; // every source label referenced on the card
}

interface MatchRequest {
  country?: CountryCode;
  profileSkillUris?: string[];
}

export async function POST(req: Request) {
  let body: MatchRequest;
  try {
    body = (await req.json()) as MatchRequest;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const country = body.country ?? 'GH';
  const profileSkillUris = body.profileSkillUris ?? [];
  const config = COUNTRIES[country];
  if (!config) {
    return NextResponse.json({ error: 'unknown_country' }, { status: 400 });
  }

  const [
    escoOcc,
    escoSkills,
    joined,
    employment,
    earnings,
    earningsEdu,
    wittgenstein,
    fow,
  ] = await Promise.all([
    getEscoOccupations(),
    getEscoSkills(),
    getJoinedOccupations(),
    getEmployment(country),
    getEarningsBySector(country),
    getEarningsByEducation(country),
    getWittgenstein(country),
    getFowForCountry(country),
  ]);

  // Rank via ESCO essentialSkills overlap (§7.1.1).
  const ranked = rankMatches(escoOcc.value, profileSkillUris, escoSkills.value);
  const joinedByIsco = new Map(joined.value.map((o) => [o.isco_code, o]));

  // Show top ~6 and always include at least 3 even when matches are thin.
  const topMatched = ranked.filter((r) => r.matched > 0).slice(0, 6);
  const selected = topMatched.length >= 3 ? topMatched : ranked.slice(0, 6);

  const cards: OpportunityCard[] = selected.map((match) => {
    const iscoCode = match.occupation.isco_code;
    const sector = iscoToSector(iscoCode);
    const wageRow = earnings.value[sector];
    const growthPct = yoyGrowthPct(employment.value, sector);
    const latestYear = employment.value
      .filter((r) => r.sector === sector)
      .reduce((max, r) => (r.year > max ? r.year : max), 0);
    const premium = tertiaryPremium(earningsEdu.value, sector);
    const joinedOcc = joinedByIsco.get(iscoCode);
    const foRaw = joinedOcc?.frey_osborne_raw ?? 0;
    const taskContent = fow.value.byIsco.get(iscoCode);
    const breakdown = calibrateRisk(foRaw, config, {
      occupationRoutineShare: taskContent?.routine_share,
      cognitiveShare: taskContent?.cognitive_share,
      manualShare: taskContent?.manual_share,
      usRoutineWeightedMean: fow.value.usRoutineWeightedMean,
    });
    const implication = buildImplication(
      wittgenstein.value,
      iscoToSectorCategory(iscoCode),
    );

    const source_trace = [
      escoOcc.source,
      earnings.source,
      employment.source,
      earningsEdu.source,
      'Frey & Osborne (2013) + ITU broadband + ' +
        (taskContent ? fow.source : 'country-level routine-task share'),
      wittgenstein.source,
    ];

    return {
      isco_code: iscoCode,
      preferred_label: match.occupation.preferred_label,
      plain_language: match.occupation.plain_language,
      match: {
        matched: match.matched,
        total: match.total,
        matched_uris: match.matchedUris,
        missing_uris: match.missingUris,
        missing_labels: match.missingLabels,
      },
      sector,
      signals: {
        wage: wageRow
          ? {
              mean_monthly: wageRow.mean_monthly,
              currency: wageRow.currency,
              year: wageRow.year,
              source: earnings.source,
            }
          : null,
        growth: {
          yoy_pct: growthPct,
          latest_year: latestYear || null,
          source: employment.source,
        },
        premium: premium
          ? {
              sector: premium.sector,
              baseBucket: premium.baseBucket,
              higherBucket: premium.higherBucket,
              premium_pct: premium.premiumPct,
              source: earningsEdu.source,
            }
          : null,
      },
      risk: {
        breakdown,
        source_long: 'Frey & Osborne (2013) · US baseline',
        source_near: taskContent
          ? `ITU broadband (${config.broadbandPenetration}%) × ILO Future of Work task share (${taskContent.routine_share.toFixed(2)})`
          : `ITU broadband (${config.broadbandPenetration}%) × country routine-task share (${config.routineTaskShare})`,
      },
      wittgenstein: {
        implication,
        source: wittgenstein.source,
      },
      pathway: { training_providers: config.trainingProviders },
      onet_tasks: joinedOcc?.onet_tasks ?? [],
      source_trace,
    };
  });

  return NextResponse.json({
    country,
    cards,
    country_name: config.name,
    currency_label: config.currencyLabel,
  });
}
