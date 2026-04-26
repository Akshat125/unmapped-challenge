'use client';

import { useMemo } from 'react';
import en from '@/messages/en.json';
import twLatn from '@/messages/tw-Latn.json';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';

// Lightweight runtime i18n. The country switcher is client-side and must
// re-render strings instantly, so we skip next-intl's URL-routing machinery
// and read directly from the Zustand store. `next-intl` is still installed
// if the team wants to upgrade to its provider pattern later.

type Messages = typeof en;

const BUNDLES: Record<string, Messages> = {
  en: en as Messages,
  'tw-Latn': twLatn as Messages,
};

export function localeFor(country: CountryCode): string {
  const locale = COUNTRIES[country].locale;
  return BUNDLES[locale] ? locale : 'en';
}

function lookup(messages: Messages, key: string): string {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof node === 'string' ? node : key;
}

export function useT() {
  const country = useProfile((s) => s.country);
  const locale = localeFor(country);
  const bundle = BUNDLES[locale];
  return useMemo(() => (key: string) => lookup(bundle, key), [bundle]);
}
