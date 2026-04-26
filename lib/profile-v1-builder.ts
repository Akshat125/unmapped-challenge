// Builder: produce a unmapped.profile/v1 record from either source of truth.
//
//   youth self-serve:  buildYouthProfileV1(answers, mapping, country, catalog, risks)
//   ngo-mediated:       buildNavigatorProfileV1(ngoProfile, mapping, risks, nav)
//
// Both paths emit the same JSON-LD shape so the employer decoder doesn't
// care where a profile came from.

import type { CountryCode } from '@/lib/config/countries';
import type { SkillMapResult } from '@/lib/esco-mapper';
import type { EscoSkill, EscoOccupation } from '@/lib/data-loaders/esco';
import type { NgoCaseloadProfile } from '@/lib/ngo-store';
import {
  PROFILE_SCHEMA_VERSION,
  JSONLD_CONTEXT,
  uuid,
  type ProfileV1,
  type ProfileSignal,
  type ProfileVerification,
  type ProfileRisk,
} from '@/lib/profile-schema';

export interface OccupationRiskSummary {
  isco_code: string;
  base_exposure: number;
  calibrated_risk: number;
  skill_complexity_score: number;
  infrastructure_delay_factor: number;
}

interface BuildOpts {
  catalogSkills: EscoSkill[];
  catalogOccupations: EscoOccupation[];
  risks?: OccupationRiskSummary[];
}

function buildSignals(
  mapping: SkillMapResult | null,
  catalogSkills: EscoSkill[],
  rawText: string,
): ProfileSignal[] {
  if (!mapping) return [];
  const labelByUri = new Map(catalogSkills.map((s) => [s.uri, s.label]));
  return mapping.esco_skills.map((uri) => ({
    skill_code: uri,
    task_description: labelByUri.get(uri) ?? rawText.slice(0, 120),
    confidence: mapping.confidence,
  }));
}

function buildRiskProfile(risks: OccupationRiskSummary[] | undefined): ProfileRisk[] {
  const now = new Date().toISOString();
  return (risks ?? []).map((r) => ({
    isco_code: r.isco_code,
    base_exposure: r.base_exposure,
    calibrated_risk: r.calibrated_risk,
    last_calc_date: now,
    skill_complexity_score: r.skill_complexity_score,
    infrastructure_delay_factor: r.infrastructure_delay_factor,
  }));
}

// ---- Youth self-serve ----------------------------------------------------
export interface YouthProfileInput {
  country: CountryCode;
  answers: {
    education?: string;
    workText?: string;
    toolsText?: string;
    languages?: string[];
    aspirationsText?: string;
  };
  mapping: SkillMapResult | null;
  createdAt?: string;
}

export function buildYouthProfileV1(
  input: YouthProfileInput,
  opts: BuildOpts,
): ProfileV1 {
  return {
    '@context': JSONLD_CONTEXT,
    '@type': 'SkillIdentity',
    schema: PROFILE_SCHEMA_VERSION,
    core: {
      id: uuid(),
      timestamp: input.createdAt ?? new Date().toISOString(),
      standard: 'ISCO-08',
    },
    country: input.country,
    subject: {
      education: input.answers.education,
      languages: input.answers.languages,
      self_report: {
        work_text: input.answers.workText,
        tools_text: input.answers.toolsText,
        aspirations_text: input.answers.aspirationsText,
      },
    },
    signals: buildSignals(
      input.mapping,
      opts.catalogSkills,
      input.answers.workText ?? input.answers.toolsText ?? '',
    ),
    isco_occupations: input.mapping?.isco_occupations ?? [],
    verifications: [],
    risk_profile: buildRiskProfile(opts.risks),
  };
}

// ---- NGO-mediated --------------------------------------------------------
// The function name is preserved (buildNavigatorProfileV1) because it's
// imported from the ProfileV1 emission path and renaming it would require
// editing code that touches the JSON-LD schema — see lib/** rename policy.
export function buildNavigatorProfileV1(
  profile: NgoCaseloadProfile,
  mapping: SkillMapResult | null,
  nav: { id: string; name: string },
  opts: BuildOpts,
): ProfileV1 {
  const verifications: ProfileVerification[] = profile.validations.map((v) => ({
    navigator_id: v.validatorId,
    navigator_name: v.validatorName,
    skill_code: v.skillUri,
    method: v.method,
    date: v.validatedAt,
    signature: v.signature,
    note: v.note,
  }));

  return {
    '@context': JSONLD_CONTEXT,
    '@type': 'SkillIdentity',
    schema: PROFILE_SCHEMA_VERSION,
    core: { id: profile.id, timestamp: profile.createdAt, standard: 'ISCO-08' },
    country: profile.country,
    subject: {
      display_name: profile.displayName,
      education: profile.education,
      languages: profile.languages,
      self_report: {
        work_text: profile.workText,
        tools_text: profile.toolsText,
        aspirations_text: profile.aspirationsText,
      },
    },
    signals: buildSignals(
      mapping,
      opts.catalogSkills,
      profile.workText ?? profile.toolsText ?? '',
    ),
    isco_occupations: mapping?.isco_occupations ?? [],
    verifications,
    risk_profile: buildRiskProfile(opts.risks),
    navigator: nav,
  };
}
