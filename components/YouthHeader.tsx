'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  FileText,
  Briefcase,
  Users,
  BarChart3,
  Plug,
  ShieldAlert,
  HeartHandshake,
} from 'lucide-react';
import { CountrySwitcher } from './CountrySwitcher';
import { BandwidthBadge } from './BandwidthBadge';
import { useT } from '@/lib/i18n';

interface NavItem {
  href: string;
  label: string;
  icon: typeof Sparkles;
}

export function YouthHeader() {
  const t = useT();
  const pathname = usePathname() ?? '/';

  const primary: NavItem[] = [
    { href: '/', label: t('nav.entry'), icon: Sparkles },
    { href: '/profile', label: t('nav.profile'), icon: FileText },
    { href: '/opportunities', label: t('nav.opportunities'), icon: Briefcase },
  ];
  const secondary: NavItem[] = [
    { href: '/navigator', label: 'Navigator', icon: HeartHandshake },
    { href: '/employer', label: 'Employer', icon: Users },
    { href: '/policymaker', label: 'Policymaker', icon: BarChart3 },
    { href: '/integrate', label: 'Integrate', icon: Plug },
    { href: '/about/limits', label: 'Limits', icon: ShieldAlert },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-wb-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded"
          >
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-6 w-6 rounded bg-wb-navy"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #002244 0%, #009FDF 60%, #00A499 100%)',
                }}
              />
              {t('brand.name')}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {primary.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded px-3 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wb-blue ${
                    active
                      ? 'bg-wb-sand text-wb-navy'
                      : 'text-wb-ink/70 hover:text-wb-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BandwidthBadge />
          <CountrySwitcher />
        </div>
      </div>
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-center gap-1 border-t border-wb-line/70 px-6 py-2 text-xs">
        <span className="mr-2 font-medium uppercase tracking-widest text-wb-ink/40">
          Other views
        </span>
        {secondary.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-wb-blue ${
                active
                  ? 'text-wb-navy underline underline-offset-4'
                  : 'text-wb-ink/60 hover:text-wb-navy'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
