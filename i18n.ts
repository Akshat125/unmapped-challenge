import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'tw-Latn'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const resolved = (locales as readonly string[]).includes(locale) ? locale : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  };
});
