export type CountryCode = 'GH' | 'BD' | 'VN' | 'KE' | 'BR';

export type OpportunityEmphasis = 'self_employment_gig' | 'formal_training';

export interface EducationLevel {
  id: string;
  label: string;
  localizedLabel?: string;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  locale: string;
  active: boolean;
  educationLevels: EducationLevel[];
  languages: { code: string; label: string }[];
  currencyLabel: string;
  opportunityEmphasis: OpportunityEmphasis;
  // ITU mobile broadband subscriptions per 100 inhabitants (0-100+).
  // Risk calibration uses this as infrastructure_factor input.
  broadbandPenetration: number;
  // ILO routine-task share (0-1). Higher => more automation-exposed task mix.
  routineTaskShare: number;
  // Local training providers referenced on opportunity cards. Placeholder list
  // so the pathway copy has something concrete; replace with verified providers
  // before the demo recording.
  trainingProviders: string[];
}

// Frey-Osborne's US baseline routine-task share used to normalize
// task_composition_factor in the risk calibration formula (§6.4).
// Single constant, not per-country.
export const US_ROUTINE_TASK_SHARE = 0.38;

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  GH: {
    code: 'GH',
    name: 'Ghana',
    locale: 'tw-Latn',
    active: true,
    educationLevels: [
      { id: 'none', label: 'No formal schooling', localizedLabel: 'Mennya sukuu biara' },
      { id: 'bece', label: 'BECE (Junior High)', localizedLabel: 'BECE (JHS)' },
      { id: 'shs', label: 'SHS / WASSCE', localizedLabel: 'SHS / WASSCE' },
      { id: 'tertiary', label: 'Tertiary / University', localizedLabel: 'Sukuupɔn' },
    ],
    languages: [
      { code: 'en', label: 'English' },
      { code: 'tw', label: 'Twi' },
      { code: 'ee', label: 'Ewe' },
      { code: 'ga', label: 'Ga' },
      { code: 'ha', label: 'Hausa' },
    ],
    currencyLabel: 'GHS',
    opportunityEmphasis: 'self_employment_gig',
    broadbandPenetration: 68,
    routineTaskShare: 0.48,
    trainingProviders: ['NVTI', 'GIZ Ghana', 'Ashesi Career Centre', 'MEST Africa'],
  },

  BD: {
    code: 'BD',
    name: 'Bangladesh',
    // Locale reserved — Bangla strings not shipped this session
    // (see LOCALE_DECISION.md). UI falls back to English for BD.
    locale: 'en',
    active: true,
    educationLevels: [
      { id: 'none', label: 'No formal schooling' },
      { id: 'ssc', label: 'SSC (Secondary)' },
      { id: 'hsc', label: 'HSC (Higher Secondary)' },
      { id: 'bachelor', label: 'Bachelor / University' },
    ],
    languages: [
      { code: 'bn', label: 'Bengali' },
      { code: 'en', label: 'English' },
    ],
    currencyLabel: 'BDT',
    opportunityEmphasis: 'formal_training',
    broadbandPenetration: 40,
    routineTaskShare: 0.52,
    trainingProviders: ['BTEB', 'a2i Skills', 'BRAC Skills Development', 'ILO Bangladesh'],
  },

  VN: {
    code: 'VN',
    name: 'Vietnam',
    locale: 'en',
    active: false,
    educationLevels: [
      { id: 'none', label: 'No formal schooling' },
      { id: 'lower_secondary', label: 'Lower secondary' },
      { id: 'upper_secondary', label: 'Upper secondary' },
      { id: 'tertiary', label: 'Tertiary / University' },
    ],
    languages: [
      { code: 'vi', label: 'Vietnamese' },
      { code: 'en', label: 'English' },
    ],
    currencyLabel: 'VND',
    opportunityEmphasis: 'formal_training',
    broadbandPenetration: 82,
    routineTaskShare: 0.44,
    trainingProviders: ['[stub] vocational college', '[stub] training provider'],
  },

  KE: {
    code: 'KE',
    name: 'Kenya',
    locale: 'en',
    active: false,
    educationLevels: [
      { id: 'none', label: 'No formal schooling' },
      { id: 'kcpe', label: 'KCPE (Primary)' },
      { id: 'kcse', label: 'KCSE (Secondary)' },
      { id: 'tertiary', label: 'Tertiary / University' },
    ],
    languages: [
      { code: 'sw', label: 'Swahili' },
      { code: 'en', label: 'English' },
    ],
    currencyLabel: 'KES',
    opportunityEmphasis: 'self_employment_gig',
    broadbandPenetration: 55,
    routineTaskShare: 0.5,
    trainingProviders: ['[stub] TVET institute', '[stub] training provider'],
  },

  BR: {
    code: 'BR',
    name: 'Brazil',
    locale: 'en',
    active: false,
    educationLevels: [
      { id: 'none', label: 'No formal schooling' },
      { id: 'ensino_fundamental', label: 'Ensino fundamental' },
      { id: 'ensino_medio', label: 'Ensino médio' },
      { id: 'superior', label: 'Ensino superior' },
    ],
    languages: [
      { code: 'pt', label: 'Portuguese' },
      { code: 'en', label: 'English' },
    ],
    currencyLabel: 'BRL',
    opportunityEmphasis: 'formal_training',
    broadbandPenetration: 90,
    routineTaskShare: 0.42,
    trainingProviders: ['[stub] SENAI', '[stub] training provider'],
  },
};

export const ACTIVE_COUNTRIES: CountryCode[] = (
  Object.keys(COUNTRIES) as CountryCode[]
).filter((c) => COUNTRIES[c].active);

export function getCountry(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}
