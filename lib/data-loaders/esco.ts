import { readEnvelope } from './_read';
import type { Sourced } from './types';

export interface EscoSkill {
  uri: string;
  label: string;
}

export interface EscoOccupation {
  isco_code: string;
  esco_uri: string;
  preferred_label: string;
  plain_language: string;
  essential_skills: string[];
}

export async function getEscoSkills(): Promise<Sourced<EscoSkill[]>> {
  return readEnvelope<EscoSkill[]>('esco_skills.json');
}

export async function getEscoOccupations(): Promise<Sourced<EscoOccupation[]>> {
  return readEnvelope<EscoOccupation[]>('esco_occupations.json');
}
