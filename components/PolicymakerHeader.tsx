'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
  Grid3x3,
  GitCompareArrows,
  TrendingUp,
  SlidersHorizontal,
  Settings,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import { useProfile } from '@/lib/profile-store';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';

const ORDER: CountryCode[] = ['GH', 'BD', 'VN', 'KE', 'BR'];

export function PolicymakerHeader() {
  const country = useProfile((s) => s.country);
  const setCountry = useProfile((s) => s.setCountry);
  const pathname = usePathname() ?? '';

  const nav = [
    { href: '/policymaker', label: 'Overview', icon: Gauge, exact: true },
    { href: '/policymaker/skill-gaps', label: 'Skill gaps', icon: Grid3x3 },
    { href: '/policymaker/divergence', label: 'Divergence', icon: GitCompareArrows },
    { href: '/policymaker/sectors', label: 'Sectors', icon: TrendingUp },
    { href: '/policymaker/invest', label: 'Invest', icon: SlidersHorizontal },
    { href: '/policymaker/config', label: 'Config', icon: Settings },
    { href: '/policymaker/ecosystem', label: 'Ecosystem', icon: Globe },
  ];
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-wb-navy text-white shadow-lg">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/policymaker"
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-ys-teal rounded"
          >
            <span
              aria-hidden
              className="inline-block h-6 w-6 rounded"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #00A499 0%, #009FDF 50%, #F4B400 100%)',
              }}
            />
            <span>UNMAPPED</span>
            <span className="text-white/40">·</span>
            <span className="text-white/80">Policymaker</span>
          </Link>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-white/50 lg:inline">
            National Human Capital Command Center
          </span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-white/60">Country</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="min-h-[40px] rounded border border-white/20 bg-wb-ink px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ys-teal"
          >
            {ORDER.map((code) => {
              const c = COUNTRIES[code];
              return (
                <option key={code} value={code} disabled={!c.active}>
                  {c.name}
                  {c.active ? '' : ' (stub)'}
                </option>
              );
            })}
          </select>
        </label>
      </div>
      <nav className="border-t border-white/10 bg-wb-ink/40">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-1 px-4 py-2 text-sm">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ys-teal ${
                  active
                    ? 'bg-white/10 text-ys-teal font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                {label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-white/50 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Youth view
          </Link>
        </div>
      </nav>
    </header>
  );
}
