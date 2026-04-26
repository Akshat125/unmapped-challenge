'use client';

import Link from 'next/link';
import { useProfile } from '@/lib/profile-store';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';

const ORDER: CountryCode[] = ['GH', 'BD', 'VN', 'KE', 'BR'];

export function PolicymakerHeader() {
  const country = useProfile((s) => s.country);
  const setCountry = useProfile((s) => s.setCountry);

  return (
    <header className="bg-wb-navy text-white">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/policymaker" className="text-lg font-bold tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            UNMAPPED · Policymaker
          </Link>
          <span className="hidden text-xs uppercase tracking-widest text-white/60 sm:inline">
            National Human Capital Command Center
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/policymaker" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Overview
          </Link>
          <Link href="/policymaker/skill-gaps" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Skill gaps
          </Link>
          <Link href="/policymaker/divergence" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Divergence
          </Link>
          <Link href="/policymaker/sectors" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Sectors
          </Link>
          <Link href="/policymaker/invest" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Invest
          </Link>
          <Link href="/policymaker/config" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Config
          </Link>
          <Link href="/policymaker/ecosystem" className="hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            Ecosystem
          </Link>
          <Link href="/" className="ml-4 text-xs text-white/60 hover:text-ys-teal focus:outline-none focus:ring-2 focus:ring-ys-teal rounded">
            ← Youth view
          </Link>
        </nav>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-white/60">Country:</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="min-h-[44px] rounded border border-wb-line/30 bg-wb-ink px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-ys-teal"
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
    </header>
  );
}
