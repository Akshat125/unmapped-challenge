'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake } from 'lucide-react';
import { useNavigatorStore } from '@/lib/navigator-store';
import { RoleSwitcher } from './RoleSwitcher';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { NGO_STEPS, matchStep } from '@/lib/workflow-steps';

export function NavigatorHeader() {
  const name = useNavigatorStore((s) => s.navigatorName);
  const setName = useNavigatorStore((s) => s.setNavigatorName);
  const pathname = usePathname() ?? '/navigator';
  const currentIndex = Math.max(0, matchStep(NGO_STEPS, pathname));

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line bg-wb-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/navigator"
          className="inline-flex items-center gap-2 rounded text-lg font-bold text-wb-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
        >
          <HeartHandshake className="h-5 w-5 text-ys-teal" strokeWidth={2} aria-hidden />
          <span>UNMAPPED</span>
          <span className="text-wb-ink/40">·</span>
          <span className="text-wb-ink/80">NGOs &amp; Training Providers</span>
        </Link>
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
