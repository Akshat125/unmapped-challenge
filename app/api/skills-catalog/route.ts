import { NextResponse } from 'next/server';
import { getEscoSkills, getEscoOccupations } from '@/lib/data-loaders/esco';

// GET /api/skills-catalog
// Returns the flat skills + occupations lists from the ESCO subset. Consumed
// by client-side components that need to render human-readable labels for
// the ESCO/ISCO codes stored in the Zustand profile.
export async function GET() {
  const [skills, occupations] = await Promise.all([
    getEscoSkills(),
    getEscoOccupations(),
  ]);
  return NextResponse.json({
    skills: skills.value,
    skillsSource: skills.source,
    occupations: occupations.value,
    occupationsSource: occupations.source,
  });
}
