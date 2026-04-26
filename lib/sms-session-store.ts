// SMS session store — in-memory Map keyed by phone number.
//
// PRODUCTION NOTE: Next.js `next dev` and a long-running Node server keep this
// Map alive across requests, which is all the hackathon demo needs. A Vercel
// serverless deployment spins up a new process per request, so this Map would
// reset between SMS messages — production deployment requires Redis (Vercel
// KV, Upstash) with the same get/set/delete interface. See SMS_SETUP.md.

import type { SessionState } from './sms-state-machine';

interface StoredSession {
  state: SessionState;
  updatedAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min of inactivity drops the session
const store = new Map<string, StoredSession>();

export function getSession(phone: string): SessionState | null {
  const entry = store.get(phone);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > SESSION_TTL_MS) {
    store.delete(phone);
    return null;
  }
  return entry.state;
}

export function setSession(phone: string, state: SessionState): void {
  store.set(phone, { state, updatedAt: Date.now() });
}

export function deleteSession(phone: string): void {
  store.delete(phone);
}

export function allSessions(): Array<{ phone: string; state: SessionState }> {
  return Array.from(store.entries()).map(([phone, { state }]) => ({ phone, state }));
}
