import { readEnvelope } from './_read';
import type { Sourced } from './types';

// Single joined record per occupation: ESCO x O*NET x Frey-Osborne, joined via
// the SOC-to-ISCO-08 crosswalk in scripts/data-prep/build_occupation_subset.py.
// This is what opportunity cards (later build step) consume directly.
export interface JoinedOccupation {
  isco_code: string;
  soc_code: string;
  esco_uri: string;
  preferred_label: string;
  plain_language: string;
  essential_skills: string[];
  onet_tasks: string[];
  frey_osborne_raw: number;
}

export async function getJoinedOccupations(): Promise<Sourced<JoinedOccupation[]>> {
  return readEnvelope<JoinedOccupation[]>('occupations_joined.json');
}
