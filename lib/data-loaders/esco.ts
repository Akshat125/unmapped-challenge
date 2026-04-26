import { readEnvelope } from './_read';
import type { Sourced } from './types';

export interface EscoSkill {
  uri: string;
  label: string;
  alt_labels?: string[];
  description?: string;
}

export interface EscoOccupation {
  isco_code: string;
  esco_uri: string;
  preferred_label: string;
  plain_language: string;
  essential_skills: string[];
  frey_osborne_raw?: number;
}

export async function getEscoSkills(): Promise<Sourced<EscoSkill[]>> {
  return readEnvelope<EscoSkill[]>('esco_skills.json');
}

export async function getEscoOccupations(): Promise<Sourced<EscoOccupation[]>> {
  return readEnvelope<EscoOccupation[]>('esco_occupations.json');
}
