'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CountryCode } from '@/lib/config/countries';
import { uuid } from '@/lib/profile-schema';

// Navigator caseload. Each caseload entry is a youth profile the navigator
// maintains on behalf of a young person who lacks a device / literacy to
// self-serve. The profile is still Amara-owned in principle: the navigator
// captures it, but the JSON export (from the youth profile page) is what
// ultimately travels with her.
export interface NavigatorProfile {
  id: string;
  displayName: string;
  country: CountryCode;
  createdAt: string;
  lastUpdatedAt: string;
  education?: string;
  workText?: string;
  toolsText?: string;
  languages?: string[];
  aspirationsText?: string;
  validations: Array<{
    // Immutable once recorded — §1 audit trail. Signature covers the other
    // fields; tampering with any field invalidates signature verification.
    skillUri: string;
    skillLabel?: string;
    method: 'observation' | 'test' | 'peer_vouch' | 'training_certificate';
    note?: string;
    validatedAt: string;
    validatorId: string;   // navigator UUID
    validatorName: string;
    signature: string;     // SHA-256 over (id + skill + method + date + note)
  }>;
  localPathways: string[];
  status: 'intake' | 'training' | 'placed' | 'paused';
  placement?: { isco_code: string; employer_type: 'formal' | 'informal' | 'gig'; placed_at: string };
  // Transition monitoring (V3.0 §3 Step 4): count of times the profile has
  // been exported into "Discovery" (share link, JSON download, employer hand-off).
  exports_count: number;
  last_exported_at?: string;
}

interface NavigatorState {
  navigatorId: string;      // UUID, stable across sessions for this navigator
  navigatorName: string;
  profiles: NavigatorProfile[];
  setNavigatorName: (name: string) => void;
  addProfile: (p: Omit<NavigatorProfile, 'id' | 'createdAt' | 'lastUpdatedAt' | 'validations' | 'localPathways' | 'status' | 'exports_count'>) => NavigatorProfile;
  updateProfile: (id: string, patch: Partial<NavigatorProfile>) => void;
  removeProfile: (id: string) => void;
  addValidation: (id: string, v: NavigatorProfile['validations'][number]) => void;
  markExported: (id: string) => void;
}

export const useNavigatorStore = create<NavigatorState>()(
  persist(
    (set, get) => ({
      navigatorId: uuid(),
      navigatorName: 'Navigator',
      profiles: [],
      setNavigatorName: (name) => set({ navigatorName: name }),
      addProfile: (p) => {
        const now = new Date().toISOString();
        const profile: NavigatorProfile = {
          ...p,
          id: uuid(),
          createdAt: now,
          lastUpdatedAt: now,
          validations: [],
          localPathways: [],
          status: 'intake',
          exports_count: 0,
        };
        set({ profiles: [...get().profiles, profile] });
        return profile;
      },
      updateProfile: (id, patch) =>
        set({
          profiles: get().profiles.map((p) =>
            p.id === id
              ? { ...p, ...patch, lastUpdatedAt: new Date().toISOString() }
              : p,
          ),
        }),
      removeProfile: (id) =>
        set({ profiles: get().profiles.filter((p) => p.id !== id) }),
      addValidation: (id, v) =>
        set({
          profiles: get().profiles.map((p) =>
            p.id === id
              ? {
                  ...p,
                  validations: [...p.validations, v],
                  lastUpdatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }),
      markExported: (id) =>
        set({
          profiles: get().profiles.map((p) =>
            p.id === id
              ? {
                  ...p,
                  exports_count: (p.exports_count ?? 0) + 1,
                  last_exported_at: new Date().toISOString(),
                  lastUpdatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }),
    }),
    {
      name: 'unmapped-navigator',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
