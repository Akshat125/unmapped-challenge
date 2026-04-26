import { readEnvelope } from './_read';
import type { Sourced } from './types';

// Sidecar overlay produced by scripts/data-prep/build_frey_osborne_overlay.py
// which projects Frey & Osborne (2013)'s SOC-keyed automation probabilities
// onto the ISCO-08 axis using the BLS/ILO crosswalk in
// scripts/data-prep/crosswalks/onet_soc_isco08.csv. Loaded alongside ESCO
// occupations at request time so the SOC→ISCO mapping can be iterated
// independently of the pinned ESCO release.

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

export type FreyOsborneIscoMap = Record<string, FreyOsborneIscoEntry>;

export async function getFreyOsborneOverlay(): Promise<Sourced<FreyOsborneIscoMap>> {
  return readEnvelope<FreyOsborneIscoMap>('frey_osborne_isco.json');
}
