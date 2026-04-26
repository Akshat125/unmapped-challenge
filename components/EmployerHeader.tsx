'use client';

import { usePathname } from 'next/navigation';
import { RoleSwitcher } from './RoleSwitcher';
import { BrandMark } from './ui/BrandMark';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { EMPLOYER_STEPS, matchStep } from '@/lib/workflow-steps';

export function EmployerHeader() {
  const pathname = usePathname() ?? '/employer';
  const currentIndex = Math.max(0, matchStep(EMPLOYER_STEPS, pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line border-l-4 border-l-wb-blue bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <BrandMark href="/employer" subtitle="Employer" />
        <div className="flex flex-wrap items-center gap-3">
          <p className="hidden text-xs italic text-wb-ink/60 lg:block">
            &ldquo;Hire based on verified potential, not missing papers.&rdquo;
          </p>
          <RoleSwitcher />
        </div>
      </div>
      <div className="mx-auto max-w-[80rem] border-t border-wb-line/70 px-6 py-3">
        <WorkflowStepper steps={EMPLOYER_STEPS} currentIndex={currentIndex} />
      </div>
    </header>
  );
}
