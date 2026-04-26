'use client';

import { useMemo } from 'react';
import en from '@/messages/en.json';
import { useProfile } from '@/lib/profile-store';

// Lightweight runtime i18n — English only. Single bundle, no locale switching.
// next-intl is still installed if the team wants to upgrade to a multi-locale
// provider pattern later.

type Messages = typeof en;

const bundle: Messages = en as Messages;

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
  // country is still read so the store subscription keeps working for
  // callers that also use it; locale-switching is removed.
  useProfile((s) => s.country);
  return useMemo(() => (key: string) => lookup(bundle, key), []);
}
