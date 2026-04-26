import { readEnvelope } from './_read';
import type { Sourced } from './types';

export interface IscoEntry {
  code: string;
  title: string;
}

export async function getIsco(): Promise<Sourced<IscoEntry[]>> {
  return readEnvelope<IscoEntry[]>('isco08.json');
}
