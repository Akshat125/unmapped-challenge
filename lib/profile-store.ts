'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CountryCode } from '@/lib/config/countries';
import type { SkillMapResult } from '@/lib/esco-mapper';

// Minimal client-side state per spec §4 ("Zustand for skills profile only").
// Answers persist to localStorage so a dropped connection doesn't wipe
// Amara's work (§7.1.2 step 4, §10 requirement).

export interface ProfileAnswers {
  education?: string;
  workText?: string;
  toolsText?: string;
  languages?: string[];
  aspirationsText?: string;
}

export interface ProfileState {
  country: CountryCode;
  answers: ProfileAnswers;
  mapping: SkillMapResult | null;
  mappedAt: string | null; // ISO timestamp
  setCountry: (code: CountryCode) => void;
  setAnswer: <K extends keyof ProfileAnswers>(key: K, value: ProfileAnswers[K]) => void;
  setMapping: (mapping: SkillMapResult) => void;
  reset: () => void;
}

const INITIAL_ANSWERS: ProfileAnswers = {};

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      country: 'GH',
      answers: INITIAL_ANSWERS,
      mapping: null,
      mappedAt: null,
      setCountry: (code) => set({ country: code }),
      setAnswer: (key, value) =>
        set((state) => ({ answers: { ...state.answers, [key]: value } })),
      setMapping: (mapping) =>
        set({ mapping, mappedAt: new Date().toISOString() }),
      reset: () => set({ answers: INITIAL_ANSWERS, mapping: null, mappedAt: null }),
    }),
    {
      name: 'unmapped-profile',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user-meaningful bits.
      partialize: (s) => ({
        country: s.country,
        answers: s.answers,
        mapping: s.mapping,
        mappedAt: s.mappedAt,
      }),
    },
  ),
);
