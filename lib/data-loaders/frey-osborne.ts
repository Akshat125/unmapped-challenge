import { readEnvelope } from './_read';
import type { Sourced } from './types';

export type FreyOsborneTable = Record<string, number>;

export async function getFreyOsborne(): Promise<Sourced<FreyOsborneTable>> {
  return readEnvelope<FreyOsborneTable>('frey_osborne.json');
}
