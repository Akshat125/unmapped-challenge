'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Single source of truth for which user group is active. Drives the
// role-gated shell pattern: `/` lands visitors on the selector if this is
// null; the "Switch role" affordance in every shell routes back to `/`
// without clearing it (so the selector shows "Continue as <role>").

export type ActiveRole = 'youth' | 'employer' | 'ngo' | 'policymaker';

export const ROLE_HOMES: Record<ActiveRole, string> = {
  youth: '/entry',
  employer: '/employer',
  ngo: '/navigator',
  policymaker: '/policymaker',
};

export const ROLE_LABELS: Record<ActiveRole, string> = {
  youth: 'looking for work',
  employer: 'hiring',
  ngo: 'NGO or training program',
  policymaker: 'government or policy',
};

interface RoleState {
  activeRole: ActiveRole | null;
  setRole: (role: ActiveRole) => void;
  clearRole: () => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      activeRole: null,
      setRole: (role) => set({ activeRole: role }),
      clearRole: () => set({ activeRole: null }),
    }),
    {
      name: 'unmapped-role',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
