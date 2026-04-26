'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Briefcase, HeartHandshake, Landmark, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRole, ROLE_HOMES, type ActiveRole } from '@/lib/role-store';
import { BrandMark } from '@/components/ui/BrandMark';

// Role selector landing. The only surface where all four user groups are
// visible to each other. Picking a tile routes into that role's shell and
// every subsequent surface is role-locked until the user taps Switch role.

interface RoleTile {
  role: ActiveRole;
  headline: string;
  description: string;
  persona: string;
  href: string;
  icon: LucideIcon;
}

const ROLE_TILES: RoleTile[] = [
  {
    role: 'youth',
    headline: 'I am looking for work',
    description:
      'Build your skill profile in plain language. See real opportunities grounded in local wage data.',
    persona: 'Amara · 22 · Accra',
    href: ROLE_HOMES.youth,
    icon: Sparkles,
  },
  {
    role: 'employer',
    headline: 'I am hiring',
    description:
      'Find verified skills without asking for papers. Drop a job ad or pick from standard roles.',
    persona: 'SMEs · Cooperatives · Recruiters',
    href: ROLE_HOMES.employer,
    icon: Briefcase,
  },
  {
    role: 'ngo',
    headline: 'I work at an NGO or training program',
    description:
      'Verify skills, coach youth, and track their transitions into formal work.',
    persona: 'NGOs · Training providers',
    href: ROLE_HOMES.ngo,
    icon: HeartHandshake,
  },
  {
    role: 'policymaker',
    headline: 'I work in government or policy',
    description:
      'See workforce divergence, risk hotspots, and training ROI across sectors and 2030 projections.',
    persona: 'Ministries · Agencies',
    href: ROLE_HOMES.policymaker,
    icon: Landmark,
  },
];

export default function RoleSelectorLanding() {
  const router = useRouter();
  const activeRole = useRole((s) => s.activeRole);
  const setRole = useRole((s) => s.setRole);

  function pickRole(role: ActiveRole, href: string) {
    setRole(role);
    router.push(href);
  }

  const returningTile = activeRole
    ? ROLE_TILES.find((t) => t.role === activeRole) ?? null
    : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-wb-line">
        <div className="mx-auto flex max-w-[72rem] items-center justify-between px-6 py-5">
          <BrandMark />
          <nav className="flex items-center gap-6 text-sm text-wb-ink/60">
            <Link href="/integrate" className="hover:text-wb-navy">
              Integration reference
            </Link>
            <Link href="/about/limits" className="hover:text-wb-navy">
              Honest limits
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[72rem] px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
            A Shared Labor-Market Infrastructure
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-wb-navy md:text-5xl">
            Which side of the labor market are you?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-wb-ink/70 md:text-lg">
            Pick the view that fits your work today. Each role has a
            workflow built for it. You can switch later.
          </p>
        </div>

        {returningTile && (
          <section className="mt-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
              Welcome back
            </p>
            <button
              type="button"
              onClick={() => pickRole(returningTile.role, returningTile.href)}
              className="group mt-3 flex w-full items-center justify-between gap-4 rounded-lg border border-wb-navy bg-wb-navy px-6 py-5 text-left text-white shadow-sm transition-colors hover:bg-wb-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ys-teal focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-4">
                <returningTile.icon className="h-6 w-6 text-ys-teal" strokeWidth={1.75} aria-hidden />
                <div>
                  <div className="text-lg font-semibold">
                    Continue as {returningTile.headline.replace(/^I (am |work )/, '')}
                  </div>
                  <div className="mt-1 text-sm text-white/70">{returningTile.persona}</div>
                </div>
              </div>
              <ArrowRight
                className="h-5 w-5 text-white/70 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </section>
        )}

        <section className="mt-12">
          {returningTile && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
              Or choose a different role
            </p>
          )}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {ROLE_TILES.map((tile) => {
              const isCurrent = tile.role === activeRole;
              const Icon = tile.icon;
              return (
                <button
                  key={tile.role}
                  type="button"
                  onClick={() => pickRole(tile.role, tile.href)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`group flex h-full flex-col gap-4 rounded-lg border bg-white p-6 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2 ${
                    isCurrent
                      ? 'border-wb-navy ring-1 ring-wb-navy/40'
                      : 'border-wb-line hover:border-wb-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Icon
                      className="h-6 w-6 text-wb-blue"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {isCurrent && (
                      <span className="rounded-full bg-ys-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ys-teal">
                        current
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-wb-navy">
                      {tile.headline}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-wb-ink/70">
                      {tile.description}
                    </p>
                  </div>
                  <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-wb-line pt-3">
                    <span className="text-xs text-wb-ink/50">{tile.persona}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-wb-navy group-hover:text-wb-blue">
                      Continue
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="mt-20 border-t border-wb-line pt-6 text-xs text-wb-ink/50">
          Press or integration partners →{' '}
          <Link href="/integrate" className="text-wb-blue hover:underline">
            Integration reference
          </Link>
          {' · '}
          <Link href="/about/limits" className="text-wb-blue hover:underline">
            Honest limits
          </Link>
        </footer>
      </main>
    </div>
  );
}
