// Per-role workflow step definitions. Centralized so the ordered labels
// align with the spec (§ Refined User Flows) and every shell shows the
// same steps in the same order.

import type { StepDefinition } from '@/components/ui/WorkflowStepper';

export const YOUTH_STEPS: StepDefinition[] = [
  { label: 'Your story', href: '/entry' },
  { label: 'Your profile', href: '/profile' },
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Share' }, // no dedicated route — the profile page hosts the share action
];

export const EMPLOYER_STEPS: StepDefinition[] = [
  { label: 'Describe the job', href: '/employer' },
  { label: 'What we understood', href: '/employer/jd' },
  { label: 'Candidates that fit', href: '/employer/candidates' },
  { label: 'Reach out' },
];

export const NGO_STEPS: StepDefinition[] = [
  { label: 'Your youth', href: '/navigator' },
  { label: 'Add intake', href: '/navigator/bulk' },
  { label: 'Verify & coach' }, // reached via profile detail
  { label: 'Track transitions', href: '/navigator/impact' },
];

export const POLICYMAKER_STEPS: StepDefinition[] = [
  { label: 'Configure', href: '/policymaker/config' },
  { label: 'Overview', href: '/policymaker' },
  { label: 'Divergence', href: '/policymaker/divergence' },
  { label: 'Ecosystem', href: '/policymaker/ecosystem' },
];

// Map a pathname to the active step index for each role. Returns -1 if the
// route is a detail/sub-route not in the stepper so the component can
// render the stepper with the closest parent step active.
export function matchStep(steps: StepDefinition[], pathname: string): number {
  // Prefer exact match
  const exact = steps.findIndex((s) => s.href === pathname);
  if (exact >= 0) return exact;
  // Otherwise longest-prefix match among steps with href
  let bestIdx = -1;
  let bestLen = 0;
  steps.forEach((s, i) => {
    if (s.href && pathname.startsWith(s.href) && s.href.length > bestLen) {
      bestIdx = i;
      bestLen = s.href.length;
    }
  });
  return bestIdx;
}
