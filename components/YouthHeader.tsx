'use client';

import Link from 'next/link';
import { CountrySwitcher } from './CountrySwitcher';
import { BandwidthBadge } from './BandwidthBadge';
import { useT } from '@/lib/i18n';

export function YouthHeader() {
  const t = useT();
  return (
    <header className="print:hidden border-b border-wb-line bg-white">
      <div className="mx-auto flex max-w-[48rem] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
          {t('brand.name')}
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            {t('nav.entry')}
          </Link>
          <Link href="/profile" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            {t('nav.profile')}
          </Link>
          <Link href="/opportunities" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            {t('nav.opportunities')}
          </Link>
          <span className="text-wb-line">·</span>
          <Link href="/navigator" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Navigator
          </Link>
          <Link href="/employer" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Employer
          </Link>
          <Link href="/policymaker" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Policymaker
          </Link>
          <Link href="/integrate" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Integrate
          </Link>
          <Link href="/about/limits" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Limits
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <BandwidthBadge />
          <CountrySwitcher />
        </div>
      </div>
    </header>
  );
}
