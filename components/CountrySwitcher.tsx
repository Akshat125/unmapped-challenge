'use client';

import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';
import { useT } from '@/lib/i18n';

const ORDER: CountryCode[] = ['GH', 'BD', 'VN', 'KE', 'BR'];

export function CountrySwitcher() {
  const country = useProfile((s) => s.country);
  const setCountry = useProfile((s) => s.setCountry);
  const t = useT();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-wb-ink/70">{t('country_switcher.label')}:</span>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value as CountryCode)}
        className="min-h-[44px] rounded border border-wb-line bg-white px-3 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-wb-blue"
        aria-label="Country"
      >
        {ORDER.map((code) => {
          const c = COUNTRIES[code];
          return (
            <option key={code} value={code} disabled={!c.active}>
              {c.name}
              {c.active ? '' : ' (stub)'}
            </option>
          );
        })}
      </select>
    </label>
  );
}
