'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Cross-role market signal store. The employer JD decoder logs every mapped
// job description here; the policymaker heatmap consumes it. Navigator and
// youth profiles contribute the supply side. One store, three consumers —
// the minimal wiring the spec's "supply vs demand" claim needs.
//
// Prototype uses shared localStorage. Production is a server-side event log
// with per-tenant scoping.

export interface JdRecord {
  id: string;
  created_at: string;
  country?: string;
  text: string;
  esco_skills: string[];
  isco_top: string | null;
}

interface MarketSignalState {
  recentJds: JdRecord[];
  recordJd: (r: Omit<JdRecord, 'id' | 'created_at'>) => void;
  clearJds: () => void;
}

export const useMarketSignalStore = create<MarketSignalState>()(
  persist(
    (set, get) => ({
      recentJds: [],
      recordJd: (r) => {
        const rec: JdRecord = {
          ...r,
          id: `jd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString(),
        };
        // Cap at 50 so the store stays small.
        set({ recentJds: [rec, ...get().recentJds].slice(0, 50) });
      },
      clearJds: () => set({ recentJds: [] }),
    }),
    { name: 'unmapped-market-signals', storage: createJSONStorage(() => localStorage) },
  ),
);
