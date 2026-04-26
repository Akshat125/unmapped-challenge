import { readEnvelope } from './_read';
import type { Sourced } from './types';

export interface OnetTaskEntry {
  soc_code: string;
  tasks: string[];
}

export async function getOnetTasks(): Promise<Sourced<OnetTaskEntry[]>> {
  return readEnvelope<OnetTaskEntry[]>('onet_tasks.json');
}
