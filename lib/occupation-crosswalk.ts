import { getJoinedOccupations, type JoinedOccupation } from '@/lib/data-loaders/joined';

// Runtime helper for looking up an occupation by ISCO code — used by the
// risk tooltip (ISCO -> frey_osborne_raw) and the skill-match ranking.
// Loads once per request; cached on the module for the lifetime of the
// server process via a memoized promise.
let cached: Promise<Map<string, JoinedOccupation>> | null = null;

async function getIndex(): Promise<Map<string, JoinedOccupation>> {
  if (!cached) {
    cached = getJoinedOccupations().then(({ value }) => {
      const map = new Map<string, JoinedOccupation>();
      for (const occ of value) map.set(occ.isco_code, occ);
      return map;
    });
  }
  return cached;
}

export async function findByIsco(iscoCode: string): Promise<JoinedOccupation | null> {
  const idx = await getIndex();
  return idx.get(iscoCode) ?? null;
}

export async function findBySoc(socCode: string): Promise<JoinedOccupation | null> {
  const { value } = await getJoinedOccupations();
  return value.find((occ) => occ.soc_code === socCode) ?? null;
}
