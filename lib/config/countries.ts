// Country namespace is ISO-3 to align with the ILO data files
// data/ilo_emp_occ_{BOL,GHA,VNM}.csv. Three demo-grade countries:
//   GHA — English UI (English is Ghana's official language)
//   BOL — Spanish UI
//   VNM — Vietnamese UI
//
// The previous GH/BD/VN/KE/BR namespace + Twi-in-Latin demo locale was retired
// when this file was rewritten; see LOCALE_DECISION.md for the audit trail.

export type CountryCode = 'BOL' | 'GHA' | 'VNM';

export type DisplayLanguage = 'en' | 'es' | 'vi';

export type OpportunityEmphasis = 'self_employment_gig' | 'formal_training';

export interface EducationLevel {
  id: string;
  label: string;
  localizedLabel?: string;
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  // Native-script display name shown inside the country switcher option label.
  // Always written in the country's `displayLanguage`.
  nativeName: string;
  locale: string;
  // The language bundle the rest of the UI re-renders into when this country
  // is selected. `locale` is kept for back-compat with /policymaker/config
  // schema validation; `displayLanguage` is what i18n.ts consumes.
  displayLanguage: DisplayLanguage;
  educationLevels: EducationLevel[];
  languages: { code: string; label: string }[];
  currencyLabel: string;
  opportunityEmphasis: OpportunityEmphasis;
  // ITU mobile broadband subscriptions per 100 inhabitants (0-100+).
  // Risk calibration uses this as infrastructure_factor input.
  broadbandPenetration: number;
  // ILO routine-task share (0-1). Higher => more automation-exposed task mix.
  routineTaskShare: number;
  trainingProviders: string[];
}

// Frey-Osborne's US baseline routine-task share used to normalize
// task_composition_factor in the risk calibration formula (§6.4).
export const US_ROUTINE_TASK_SHARE = 0.38;

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  GHA: {
    code: 'GHA',
    name: 'Ghana',
    nativeName: 'Ghana',
    locale: 'en',
    displayLanguage: 'en',
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

  BOL: {
    code: 'BOL',
    name: 'Bolivia',
    nativeName: 'Bolivia',
    locale: 'es',
    displayLanguage: 'es',
    educationLevels: [
      { id: 'none', label: 'Sin escolaridad formal', localizedLabel: 'Sin escolaridad formal' },
      { id: 'primaria', label: 'Primaria', localizedLabel: 'Primaria' },
      { id: 'secundaria', label: 'Secundaria (Bachillerato)', localizedLabel: 'Secundaria (Bachillerato)' },
      { id: 'tecnico', label: 'Técnico / Instituto', localizedLabel: 'Técnico / Instituto' },
      { id: 'universidad', label: 'Universidad', localizedLabel: 'Universidad' },
    ],
    languages: [
      { code: 'es', label: 'Español' },
      { code: 'qu', label: 'Quechua' },
      { code: 'ay', label: 'Aymara' },
      { code: 'gn', label: 'Guaraní' },
    ],
    currencyLabel: 'BOB',
    opportunityEmphasis: 'self_employment_gig',
    broadbandPenetration: 53,
    routineTaskShare: 0.5,
    trainingProviders: [
      'INFOCAL',
      'Fundación Trabajo Empresa',
      'Universidad Mayor de San Andrés',
      'CEDLA',
    ],
  },

  VNM: {
    code: 'VNM',
    name: 'Vietnam',
    nativeName: 'Việt Nam',
    locale: 'vi',
    displayLanguage: 'vi',
    educationLevels: [
      { id: 'none', label: 'Chưa đi học', localizedLabel: 'Chưa đi học' },
      { id: 'lower_secondary', label: 'Trung học cơ sở', localizedLabel: 'Trung học cơ sở' },
      { id: 'upper_secondary', label: 'Trung học phổ thông', localizedLabel: 'Trung học phổ thông' },
      { id: 'vocational', label: 'Trường nghề', localizedLabel: 'Trường nghề' },
      { id: 'tertiary', label: 'Đại học / Cao đẳng', localizedLabel: 'Đại học / Cao đẳng' },
    ],
    languages: [
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'en', label: 'English' },
    ],
    currencyLabel: 'VND',
    opportunityEmphasis: 'formal_training',
    broadbandPenetration: 82,
    routineTaskShare: 0.44,
    trainingProviders: [
      'Tổng cục Giáo dục Nghề nghiệp (DVET)',
      'GIZ Vietnam',
      'VinAcademy',
      'FPT Polytechnic',
    ],
  },
};

export const ACTIVE_COUNTRIES: CountryCode[] = ['GHA', 'BOL', 'VNM'];

export const DEFAULT_COUNTRY: CountryCode = 'GHA';

export function getCountry(code: CountryCode): CountryConfig {
  return COUNTRIES[code];
}

// Backwards-compat helper: persisted profiles from earlier sessions used the
// 2-letter codes GH/BD/VN/KE/BR. Map any legacy code to the closest current
// country so localStorage migrations don't dump users on a 404 screen.
const LEGACY_CODE_MAP: Record<string, CountryCode> = {
  GH: 'GHA',
  GHA: 'GHA',
  BO: 'BOL',
  BOL: 'BOL',
  VN: 'VNM',
  VNM: 'VNM',
  // Retired countries fall through to Ghana so the demo never breaks.
  BD: 'GHA',
  KE: 'GHA',
  BR: 'GHA',
};

export function migrateCountryCode(raw: string | undefined): CountryCode {
  if (!raw) return DEFAULT_COUNTRY;
  return LEGACY_CODE_MAP[raw] ?? DEFAULT_COUNTRY;
}
