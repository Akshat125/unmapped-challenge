'use client';

import { useMemo } from 'react';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import vi from '@/messages/vi.json';
import { COUNTRIES, type CountryCode, type DisplayLanguage } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';

// Lightweight runtime i18n. The country switcher is client-side and must
// re-render strings instantly, so we skip next-intl's URL-routing machinery
// and read directly from the Zustand store.
//
// Display language is keyed off CountryConfig.displayLanguage:
//   GHA → en
//   BOL → es
//   VNM → vi

type Messages = typeof en;

const BUNDLES: Record<DisplayLanguage, Messages> = {
  en: en as Messages,
  es: es as Messages,
  vi: vi as Messages,
};

export function languageFor(country: CountryCode): DisplayLanguage {
  return COUNTRIES[country].displayLanguage;
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
  const lang = languageFor(country);
  const bundle = BUNDLES[lang];
  return useMemo(() => (key: string) => lookup(bundle, key), [bundle]);
}
