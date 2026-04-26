'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CountrySwitcher } from './CountrySwitcher';
import { BandwidthBadge } from './BandwidthBadge';
import { RoleSwitcher } from './RoleSwitcher';
import { WorkflowStepper } from './ui/WorkflowStepper';
import { YOUTH_STEPS, matchStep } from '@/lib/workflow-steps';
import { useT } from '@/lib/i18n';

export function YouthHeader() {
  const t = useT();
  const pathname = usePathname() ?? '/entry';
  const currentIndex = Math.max(0, matchStep(YOUTH_STEPS, pathname));

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-wb-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/entry"
          className="inline-flex items-center gap-2 rounded text-lg font-bold tracking-tight text-wb-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
        >
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #002244 0%, #009FDF 60%, #00A499 100%)',
            }}
          />
          {t('brand.name')}
        </Link>
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
