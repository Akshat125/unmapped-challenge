import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Sourced } from './types';

// Loaders run on the server only. Read committed JSON from public/data/.
const DATA_DIR = path.join(process.cwd(), 'public', 'data');

interface RawEnvelope<T> {
  source: string;
  fetched_at: string;
  values: T;
}

export async function readEnvelope<T>(filename: string): Promise<Sourced<T>> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
  const env = JSON.parse(raw) as RawEnvelope<T>;
  return { value: env.values, source: env.source, fetchedAt: env.fetched_at };
}
