'use client';

import { useEffect, useState } from 'react';
import type { EscoSkill, EscoOccupation } from '@/lib/data-loaders/esco';

// Client-side catalog cache. One fetch per session. Used by the profile
// and opportunities pages to resolve ESCO URIs / ISCO codes to labels.
export interface Catalog {
  skills: EscoSkill[];
  occupations: EscoOccupation[];
  skillsSource: string;
  occupationsSource: string;
}

let cached: Catalog | null = null;
let inflight: Promise<Catalog> | null = null;

async function fetchCatalog(): Promise<Catalog> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch('/api/skills-catalog', { cache: 'force-cache' })
    .then((r) => r.json())
    .then((c) => {
      cached = c;
      return c;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useCatalog(): Catalog | null {
  const [cat, setCat] = useState<Catalog | null>(cached);
  useEffect(() => {
    if (!cat) fetchCatalog().then(setCat).catch(() => void 0);
  }, [cat]);
  return cat;
}
