export type CountryCode = 'GH' | 'BD';

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
    locale: 'en',
    active: true,
    educationLevels: [
      { id: 'none', label: 'No formal schooling' },
      { id: 'bece', label: 'BECE (Junior High)' },
      { id: 'shs', label: 'SHS / WASSCE' },
      { id: 'tertiary', label: 'Tertiary / University' },
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
};

export const ACTIVE_COUNTRIES: CountryCode[] = (
  Object.keys(COUNTRIES) as CountryCode[]
).filter((c) => COUNTRIES[c].active);

export function getCountry(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}
