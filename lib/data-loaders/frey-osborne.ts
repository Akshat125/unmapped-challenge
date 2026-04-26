import { readEnvelope } from './_read';
import type { Sourced } from './types';

// Sidecar overlay produced by scripts/data-prep/build_frey_osborne_overlay.py
// which projects Frey & Osborne (2013)'s SOC-keyed automation probabilities
// onto the ISCO-08 axis using the BLS/ILO crosswalk in
// scripts/data-prep/crosswalks/onet_soc_isco08.csv. Loaded alongside ESCO
// occupations at request time so the SOC→ISCO mapping can be iterated
// independently of the pinned ESCO release.
//
// The overlay ships hierarchical aggregates (4/3/2/1-digit ISCO) so that
// every ESCO occupation can resolve to a real Frey-Osborne probability —
// the SOC↔ISCO crosswalk is intrinsically sparse at the 4-digit unit-group
// level, and without the fallback the youth card would silently report
// "0% automation risk" for ~66% of occupations.

export interface FreyOsborneSource {
  soc: string;
  prob: number;
  employed: number;
  occupation: string;
}

export interface FreyOsborneIscoEntry {
  fo_prob: number;
  employed_total: number;
  n_socs: number;
  sources: FreyOsborneSource[];
}

export interface FreyOsbornePrefixEntry {
  fo_prob: number;
  employed_total: number;
  n_socs: number;
  n_isco_4: number;
  isco_4_codes: string[];
}

export interface FreyOsborneIscoMap {
  by_isco_4: Record<string, FreyOsborneIscoEntry>;
  by_isco_3: Record<string, FreyOsbornePrefixEntry>;
  by_isco_2: Record<string, FreyOsbornePrefixEntry>;
  by_isco_1: Record<string, FreyOsbornePrefixEntry>;
}

export type FreyOsborneResolutionLevel = 4 | 3 | 2 | 1;

export interface FreyOsborneResolution {
  fo_prob: number;
  level: FreyOsborneResolutionLevel;
  matched_key: string;        // e.g. "2512", "251", "25", "2"
  n_socs: number;
  n_isco_4?: number;          // only for prefix-level resolutions
  unit_group?: FreyOsborneIscoEntry;       // only when level === 4
  prefix_group?: FreyOsbornePrefixEntry;   // only when level < 4
}

// Walk up the ISCO tree until we hit a populated bucket. Returns the
// employment-weighted probability + provenance about which level matched
// so the citation can say "via ISCO 2-digit major group 25 — Science and
// engineering associate professionals".
export function resolveFreyOsborne(
  iscoCode: string,
  overlay: FreyOsborneIscoMap,
): FreyOsborneResolution | null {
  const code = (iscoCode || '').padEnd(4, '0');

  const exact = overlay.by_isco_4?.[code];
  if (exact) {
    return {
      fo_prob: exact.fo_prob,
      level: 4,
      matched_key: code,
      n_socs: exact.n_socs,
      unit_group: exact,
    };
  }
  const k3 = code.slice(0, 3);
  const m3 = overlay.by_isco_3?.[k3];
  if (m3) {
    return {
      fo_prob: m3.fo_prob,
      level: 3,
      matched_key: k3,
      n_socs: m3.n_socs,
      n_isco_4: m3.n_isco_4,
      prefix_group: m3,
    };
  }
  const k2 = code.slice(0, 2);
  const m2 = overlay.by_isco_2?.[k2];
  if (m2) {
    return {
      fo_prob: m2.fo_prob,
      level: 2,
      matched_key: k2,
      n_socs: m2.n_socs,
      n_isco_4: m2.n_isco_4,
      prefix_group: m2,
    };
  }
  const k1 = code.slice(0, 1);
  const m1 = overlay.by_isco_1?.[k1];
  if (m1) {
    return {
      fo_prob: m1.fo_prob,
      level: 1,
      matched_key: k1,
      n_socs: m1.n_socs,
      n_isco_4: m1.n_isco_4,
      prefix_group: m1,
    };
  }
  return null;
}

const ISCO_1_LABELS: Record<string, string> = {
  '0': 'Armed forces occupations',
  '1': 'Managers',
  '2': 'Professionals',
  '3': 'Technicians and associate professionals',
  '4': 'Clerical support workers',
  '5': 'Services and sales workers',
  '6': 'Skilled agricultural, forestry and fishery workers',
  '7': 'Craft and related trades workers',
  '8': 'Plant and machine operators, and assemblers',
  '9': 'Elementary occupations',
};

export function isco1Label(prefix: string): string {
  return ISCO_1_LABELS[prefix.charAt(0)] ?? `ISCO major group ${prefix.charAt(0)}`;
}

export async function getFreyOsborneOverlay(): Promise<Sourced<FreyOsborneIscoMap>> {
  return readEnvelope<FreyOsborneIscoMap>('frey_osborne_isco.json');
}
