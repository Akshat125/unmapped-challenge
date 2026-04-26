'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CountryCode } from '@/lib/config/countries';
import { uuid } from '@/lib/profile-schema';

// NGO caseload — the NGO or training provider manages a set of youth
// profiles, vouching for specific competencies and tracking transitions.
// The practitioner (the human doing the vouching) is still referred to
// as a "navigator" inside the store — that's the job title. The group
// they work for is the NGO / training provider.
//
// Note on rename: this file replaces lib/navigator-store.ts. The
// localStorage key stays "unmapped-navigator" so existing session data
// survives the rename. The `navigatorId` / `navigatorName` fields are
// preserved because they travel into the exported profile as
// `navigator_id` / `navigator_name` — a public JSON-LD contract.

export interface NgoCaseloadProfile {
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

interface NgoState {
  navigatorId: string;      // UUID, stable across sessions for this practitioner
  navigatorName: string;
  profiles: NgoCaseloadProfile[];
  setNavigatorName: (name: string) => void;
  addProfile: (p: Omit<NgoCaseloadProfile, 'id' | 'createdAt' | 'lastUpdatedAt' | 'validations' | 'localPathways' | 'status' | 'exports_count'>) => NgoCaseloadProfile;
  updateProfile: (id: string, patch: Partial<NgoCaseloadProfile>) => void;
  removeProfile: (id: string) => void;
  addValidation: (id: string, v: NgoCaseloadProfile['validations'][number]) => void;
  markExported: (id: string) => void;
}

export const useNgoStore = create<NgoState>()(
  persist(
    (set, get) => ({
      navigatorId: uuid(),
      navigatorName: 'Navigator',
      profiles: [],
      setNavigatorName: (name) => set({ navigatorName: name }),
      addProfile: (p) => {
        const now = new Date().toISOString();
        const profile: NgoCaseloadProfile = {
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

