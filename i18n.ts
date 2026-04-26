import { getRequestConfig } from 'next-intl/server';

// Locales correspond to CountryConfig.displayLanguage. tw-Latn was retired
// when the country namespace switched to BOL/GHA/VNM — see LOCALE_DECISION.md.
export const locales = ['en', 'es', 'vi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const resolved = (locales as readonly string[]).includes(locale) ? locale : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  };
});
