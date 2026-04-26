'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uuid } from '@/lib/profile-schema';

// Policymaker API & ecosystem management (V3.0 §4 Step 4). Prototype
// scope: keys are stored in localStorage; production deployment wires to
// an IAM service. We surface tenant, scopes, rate limits, and last-used so
// the dashboard reads realistically.

export type ApiScope =
  | 'read:aggregate'
  | 'read:catalog'
  | 'write:skills-map'
  | 'write:match'
  | 'write:validate-config';

export interface ApiKey {
  id: string;
  tenant: string;
  label: string;
  token_prefix: string; // shown in UI, never the full token
  created_at: string;
  scopes: ApiScope[];
  rate_limit_rpm: number;
  status: 'active' | 'revoked';
  last_used_at?: string;
  requests_24h: number;
}

interface EcosystemState {
  keys: ApiKey[];
  createKey: (input: { tenant: string; label: string; scopes: ApiScope[]; rate_limit_rpm: number }) => ApiKey;
  revokeKey: (id: string) => void;
  simulateUsage: (id: string, requests: number) => void;
}

const DEFAULT_KEYS: ApiKey[] = [
  {
    id: uuid(),
    tenant: 'NVTI (Ghana)',
    label: 'National Vocational Training Institute — intake sync',
    token_prefix: 'unm_live_NVTI_',
    created_at: '2026-02-11T08:00:00Z',
    scopes: ['read:aggregate', 'read:catalog', 'write:skills-map'],
    rate_limit_rpm: 120,
    status: 'active',
    last_used_at: '2026-04-25T14:02:18Z',
    requests_24h: 1840,
  },
  {
    id: uuid(),
    tenant: 'GIZ Ghana',
    label: 'GIZ bulk-intake pilot',
    token_prefix: 'unm_live_GIZ_',
    created_at: '2026-03-02T09:30:00Z',
    scopes: ['write:skills-map', 'write:match', 'read:catalog'],
    rate_limit_rpm: 60,
    status: 'active',
    last_used_at: '2026-04-24T21:11:44Z',
    requests_24h: 412,
  },
  {
    id: uuid(),
    tenant: 'a2i Skills (Bangladesh)',
    label: 'a2i Skills — evaluator portal',
    token_prefix: 'unm_live_a2i_',
    created_at: '2026-01-19T12:00:00Z',
    scopes: ['read:aggregate', 'read:catalog'],
    rate_limit_rpm: 240,
    status: 'active',
    last_used_at: '2026-04-26T05:47:09Z',
    requests_24h: 3102,
  },
  {
    id: uuid(),
    tenant: 'BRAC (pilot, revoked)',
    label: 'BRAC pilot — DEPRECATED',
    token_prefix: 'unm_live_BRAC_',
    created_at: '2025-11-04T10:15:00Z',
    scopes: ['write:skills-map'],
    rate_limit_rpm: 30,
    status: 'revoked',
    last_used_at: '2026-02-27T17:22:00Z',
    requests_24h: 0,
  },
];

export const useEcosystemStore = create<EcosystemState>()(
  persist(
    (set, get) => ({
      keys: DEFAULT_KEYS,
      createKey: (input) => {
        const token = `unm_live_${input.tenant.replace(/\W+/g, '').slice(0, 6).toUpperCase()}_${Math.random().toString(36).slice(2, 8)}`;
        const key: ApiKey = {
          id: uuid(),
          tenant: input.tenant,
          label: input.label,
          token_prefix: token,
          created_at: new Date().toISOString(),
          scopes: input.scopes,
          rate_limit_rpm: input.rate_limit_rpm,
          status: 'active',
          requests_24h: 0,
        };
        set({ keys: [key, ...get().keys] });
        return key;
      },
      revokeKey: (id) =>
        set({
          keys: get().keys.map((k) =>
            k.id === id ? { ...k, status: 'revoked' } : k,
          ),
        }),
      simulateUsage: (id, requests) =>
        set({
          keys: get().keys.map((k) =>
            k.id === id
              ? {
                  ...k,
                  requests_24h: requests,
                  last_used_at: new Date().toISOString(),
                }
              : k,
          ),
        }),
    }),
    { name: 'unmapped-ecosystem', storage: createJSONStorage(() => localStorage) },
  ),
);

export const ALL_SCOPES: ApiScope[] = [
  'read:aggregate',
  'read:catalog',
  'write:skills-map',
  'write:match',
  'write:validate-config',
];
