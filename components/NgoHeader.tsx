'use client';

import { usePathname } from 'next/navigation';
import { useNgoStore } from '@/lib/ngo-store';
import { RoleSwitcher } from './RoleSwitcher';
import { BrandMark } from './ui/BrandMark';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { NGO_STEPS, matchStep } from '@/lib/workflow-steps';

export function NgoHeader() {
  const name = useNgoStore((s) => s.navigatorName);
  const setName = useNgoStore((s) => s.setNavigatorName);
  const pathname = usePathname() ?? '/ngo';
  const currentIndex = Math.max(0, matchStep(NGO_STEPS, pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line bg-wb-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <BrandMark href="/ngo" subtitle="NGOs & Training Providers" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-wb-ink/60">Navigator:</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[40px] w-40 rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
            />
          </label>
          <RoleSwitcher />
        </div>
      </div>
      <div className="mx-auto max-w-[80rem] border-t border-wb-line/70 px-6 py-3">
        <WorkflowStepper steps={NGO_STEPS} currentIndex={currentIndex} />
      </div>
    </header>
  );
}
