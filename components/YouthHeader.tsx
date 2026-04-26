'use client';

import { usePathname } from 'next/navigation';
import { CountrySwitcher } from './CountrySwitcher';
import { BandwidthBadge } from './BandwidthBadge';
import { RoleSwitcher } from './RoleSwitcher';
import { BrandMark } from './ui/BrandMark';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { YOUTH_STEPS, matchStep } from '@/lib/workflow-steps';

export function YouthHeader() {
  const pathname = usePathname() ?? '/entry';
  const currentIndex = Math.max(0, matchStep(YOUTH_STEPS, pathname));

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-wb-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-3 px-6 py-4">
        <BrandMark href="/entry" />
        <div className="flex items-center gap-2">
          <BandwidthBadge />
          <CountrySwitcher />
          <RoleSwitcher />
        </div>
      </div>
      <div className="mx-auto max-w-[72rem] border-t border-wb-line/70 px-6 py-3">
        <WorkflowStepper steps={YOUTH_STEPS} currentIndex={currentIndex} />
      </div>
    </header>
  );
}
