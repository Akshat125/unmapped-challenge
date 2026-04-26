import { NextResponse } from 'next/server';
import { COUNTRIES, DEFAULT_COUNTRY, type CountryCode } from '@/lib/config/countries';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';
import {
  getEmployment,
  getEarningsBySector,
  getEarningsByEducation,
  yoyGrowthPct,
} from '@/lib/data-loaders/ilostat';
import { getWittgenstein } from '@/lib/data-loaders/wittgenstein';
import { getFowForCountry } from '@/lib/data-loaders/ilo-fow';
import { getIloIscoForCountry } from '@/lib/data-loaders/ilo-isco';
import { getFreyOsborneOverlay } from '@/lib/data-loaders/frey-osborne';
import {
  rankMatches,
  RANK_WEIGHTS,
  type EvidenceCitation,
} from '@/lib/skill-match';
import type { RiskBreakdown } from '@/lib/risk-calibration';
import { tertiaryPremium } from '@/lib/returns-to-education';
import {
  buildImplication,
  iscoToSectorCategory,
  type Implication,
} from '@/lib/wittgenstein-implications';
import { iscoToSector } from '@/lib/sector-map';

// /api/match
// Input:  { country: CountryCode, profileSkillUris: string[] }
// Output: ranked opportunity cards, fully hydrated with signals + risk + the
//         per-card citations that justify the recommendation.
//
// Every number rendered in the UI comes from this endpoint, with a source
// label attached. Spec §D1: "Every econometric figure shown must have a
// visible source label." The card UI consumes `references` to surface the
// "Why we recommended this" disclosure expanded by default.

export interface RecommendationScore {
  total: number;
  components: {
    demand: number;
    skill: number;
    safety: number;
  };
  weights: {
    demand: number;
    skill: number;
    safety: number;
  };
}

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
  score: RecommendationScore;
  references: EvidenceCitation[];
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
  source_trace: string[];
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

  const country = body.country ?? DEFAULT_COUNTRY;
  const profileSkillUris = body.profileSkillUris ?? [];
  const config = COUNTRIES[country];
  if (!config) {
    return NextResponse.json({ error: 'unknown_country' }, { status: 400 });
  }

  const [
    escoOcc,
    escoSkills,
    employment,
    earnings,
    earningsEdu,
    wittgenstein,
    fow,
    iloIsco,
    fowOverlay,
  ] = await Promise.all([
    getEscoOccupations(),
    getEscoSkills(),
    getEmployment(country),
    getEarningsBySector(country),
    getEarningsByEducation(country),
    getWittgenstein(country),
    getFowForCountry(country),
    getIloIscoForCountry(country),
    getFreyOsborneOverlay(),
  ]);

  // §7.1.1 — country-aware blended ranker. Demand:Skill:Safety = 0.50:0.35:0.15
  // Citations are returned per-card so the UI can render the
  // "Why we recommended this" disclosure expanded by default.
  const ranked = rankMatches(escoOcc.value, {
    profileSkillUris,
    allSkills: escoSkills.value,
    ilo: iloIsco.value,
    iloSourceLabel: iloIsco.source,
    fowOverlay: fowOverlay.value,
    fowOverlaySource: fowOverlay.source,
    country: config,
    riskOpts: (occupation) => {
      const tc = fow.value.byIsco.get(occupation.isco_code);
      return {
        occupationRoutineShare: tc?.routine_share,
        cognitiveShare: tc?.cognitive_share,
        manualShare: tc?.manual_share,
        usRoutineWeightedMean: fow.value.usRoutineWeightedMean,
      };
    },
  });

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
    const taskContent = fow.value.byIsco.get(iscoCode);
    const implication = buildImplication(
      wittgenstein.value,
      iscoToSectorCategory(iscoCode),
    );

    const source_trace = [
      escoOcc.source,
      iloIsco.source,
      fowOverlay.source,
      earnings.source,
      employment.source,
      earningsEdu.source,
      `weights = demand:${RANK_WEIGHTS.demand} · skill:${RANK_WEIGHTS.skill} · safety:${RANK_WEIGHTS.safety}`,
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
      score: {
        total: Number(match.score.total.toFixed(4)),
        components: {
          demand: Number(match.score.demand.toFixed(4)),
          skill: Number(match.score.skill.toFixed(4)),
          safety: Number(match.score.safety.toFixed(4)),
        },
        weights: { ...RANK_WEIGHTS },
      },
      references: match.citations,
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
        breakdown: match.risk,
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
      source_trace,
    };
  });

  return NextResponse.json({
    country,
    cards,
    country_name: config.name,
    currency_label: config.currencyLabel,
    weights: { ...RANK_WEIGHTS },
  });
}
