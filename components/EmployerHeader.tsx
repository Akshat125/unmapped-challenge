'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSearch } from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { EMPLOYER_STEPS, matchStep } from '@/lib/workflow-steps';

export function EmployerHeader() {
  const pathname = usePathname() ?? '/employer';
  const currentIndex = Math.max(0, matchStep(EMPLOYER_STEPS, pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line border-l-4 border-l-wb-blue bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/employer"
          className="inline-flex items-center gap-2 rounded text-lg font-bold text-wb-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
        >
          <FileSearch className="h-5 w-5 text-wb-blue" strokeWidth={2} aria-hidden />
          <span>UNMAPPED</span>
          <span className="text-wb-ink/40">·</span>
          <span className="text-wb-ink/80">Employer</span>
        </Link>
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
