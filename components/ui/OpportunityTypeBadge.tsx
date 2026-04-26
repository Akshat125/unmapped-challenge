import { Briefcase, Sprout, Timer, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OpportunityEmphasis } from '@/lib/config/countries';

// Surfaces the opportunity type on every card (§ country-agnostic
// requirement in the brief: "opportunity types surfaced — formal
// employment, self-employment, gig, training pathways").
//
// Derived from the country's opportunityEmphasis config + the ISCO-08
// major group of the occupation. Cheap heuristic, zero runtime cost.

type OppType = 'formal' | 'self_employment' | 'gig' | 'training';

const LABELS: Record<OppType, string> = {
  formal: 'Formal employment',
  self_employment: 'Self-employment',
  gig: 'Gig work',
  training: 'Training pathway',
};

const ICONS: Record<OppType, LucideIcon> = {
  formal: Briefcase,
  self_employment: Sprout,
  gig: Timer,
  training: GraduationCap,
};

const STYLES: Record<OppType, string> = {
  formal: 'border-wb-blue/40 bg-wb-blue/10 text-wb-blue',
  self_employment: 'border-ys-teal/40 bg-ys-teal/10 text-ys-teal',
  gig: 'border-ys-amber/40 bg-ys-amber/15 text-wb-ink',
  training: 'border-wb-navy/30 bg-wb-navy/5 text-wb-navy',
};

// Pick a type for this occupation given the country emphasis. ISCO major
// groups 9 (elementary) and 8 (plant/machine operators) lean toward gig
// in self-employment-emphasized countries; major groups 7 (craft/trades)
// lean toward self-employment; 1-4 (managers/professionals/clerical) lean
// formal.
function pickType(iscoCode: string, emphasis: OpportunityEmphasis): OppType {
  const major = iscoCode.charAt(0);
  if (major === '7' || major === '9') {
    return emphasis === 'self_employment_gig' ? 'self_employment' : 'formal';
  }
  if (major === '8') {
    return emphasis === 'self_employment_gig' ? 'gig' : 'formal';
  }
  if (major === '5') {
    return emphasis === 'self_employment_gig' ? 'self_employment' : 'formal';
  }
  // Professionals and office roles default to formal; training is used as
  // a fallback label, not derived from ISCO — the resilience coaching
  // surface uses that label instead.
  return 'formal';
}

interface Props {
  iscoCode: string;
  emphasis: OpportunityEmphasis;
  className?: string;
}

export function OpportunityTypeBadge({ iscoCode, emphasis, className = '' }: Props) {
  const type = pickType(iscoCode, emphasis);
  const Icon = ICONS[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STYLES[type]} ${className}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {LABELS[type]}
    </span>
  );
}
