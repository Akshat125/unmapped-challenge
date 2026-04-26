'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HeartHandshake,
  Users,
  Upload,
  LineChart,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useNavigatorStore } from '@/lib/navigator-store';

export function NavigatorHeader() {
  const name = useNavigatorStore((s) => s.navigatorName);
  const setName = useNavigatorStore((s) => s.setNavigatorName);
  const pathname = usePathname() ?? '';

  const primary = [
    { href: '/navigator', label: 'Caseload', icon: Users, exact: true },
    { href: '/navigator/bulk', label: 'Bulk intake', icon: Upload },
    { href: '/navigator/impact', label: 'Impact', icon: LineChart },
  ];
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line bg-wb-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/navigator"
            className="inline-flex items-center gap-2 text-lg font-bold text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded"
          >
            <HeartHandshake className="h-5 w-5 text-ys-teal" strokeWidth={2} aria-hidden />
            <span>UNMAPPED</span>
            <span className="text-wb-ink/40">·</span>
            <span className="text-wb-ink/80">Navigator portal</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {primary.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded px-3 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wb-blue ${
                    active ? 'bg-white text-wb-navy shadow-sm' : 'text-wb-ink/70 hover:text-wb-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-wb-ink/60">Navigator:</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[40px] w-40 rounded border border-wb-line bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wb-blue"
            />
          </label>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-wb-ink/60 hover:text-wb-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Youth
          </Link>
          <Link
            href="/policymaker"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-wb-ink/60 hover:text-wb-navy"
          >
            Policymaker
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
