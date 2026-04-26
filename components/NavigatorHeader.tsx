'use client';

import Link from 'next/link';
import { useNavigatorStore } from '@/lib/navigator-store';

export function NavigatorHeader() {
  const name = useNavigatorStore((s) => s.navigatorName);
  const setName = useNavigatorStore((s) => s.setNavigatorName);
  return (
    <header className="border-b border-wb-line bg-wb-sand">
      <div className="mx-auto flex max-w-[64rem] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/navigator" className="text-lg font-bold text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
          UNMAPPED · Navigator portal
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/navigator" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Caseload
          </Link>
          <Link href="/navigator/bulk" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Bulk intake
          </Link>
          <Link href="/navigator/impact" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Impact
          </Link>
          <Link href="/" className="ml-4 text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            ← Youth view
          </Link>
          <Link href="/policymaker" className="text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Policymaker →
          </Link>
        </nav>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-wb-ink/70">Navigator:</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
          />
        </label>
      </div>
    </header>
  );
}
