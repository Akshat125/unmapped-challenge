'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfileV1 } from '@/lib/profile-schema';

// Employer-side caseboard. The employer drops or scans candidate profiles;
// we persist them locally so a recruiter's shortlist survives page reloads.
// Production deployment wires this to an ATS via the /integrate API.

export interface CandidateRecord {
  id: string;                 // profile.core.id
  addedAt: string;            // ISO-8601
  profile: ProfileV1;
  rating?: 'shortlist' | 'reject' | 'review';
  notes?: string;
  signature_checks: {
    total: number;
    passed: number;
    failed_signatures: string[];
  };
}

interface EmployerState {
  candidates: CandidateRecord[];
  addCandidate: (profile: ProfileV1, signature_checks: CandidateRecord['signature_checks']) => CandidateRecord;
  rateCandidate: (id: string, rating: CandidateRecord['rating']) => void;
  setNotes: (id: string, notes: string) => void;
  removeCandidate: (id: string) => void;
  clear: () => void;
}

export const useEmployerStore = create<EmployerState>()(
  persist(
    (set, get) => ({
      candidates: [],
      addCandidate: (profile, signature_checks) => {
        const existingIdx = get().candidates.findIndex((c) => c.id === profile.core.id);
        const record: CandidateRecord = {
          id: profile.core.id,
          addedAt: new Date().toISOString(),
          profile,
          signature_checks,
          rating: undefined,
        };
        if (existingIdx >= 0) {
          const next = [...get().candidates];
          next[existingIdx] = { ...next[existingIdx], ...record };
          set({ candidates: next });
        } else {
          set({ candidates: [...get().candidates, record] });
        }
        return record;
      },
      rateCandidate: (id, rating) =>
        set({
          candidates: get().candidates.map((c) => (c.id === id ? { ...c, rating } : c)),
        }),
      setNotes: (id, notes) =>
        set({
          candidates: get().candidates.map((c) => (c.id === id ? { ...c, notes } : c)),
        }),
      removeCandidate: (id) =>
        set({ candidates: get().candidates.filter((c) => c.id !== id) }),
      clear: () => set({ candidates: [] }),
    }),
    {
      name: 'unmapped-employer',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
