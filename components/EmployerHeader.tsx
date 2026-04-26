'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileSearch, FileText, Search, ArrowLeft } from 'lucide-react';

export function EmployerHeader() {
  const pathname = usePathname() ?? '';
  const items = [
    { href: '/employer', label: 'Candidates', icon: Briefcase, exact: true },
    { href: '/employer/jd', label: 'Job description', icon: FileText },
    { href: '/employer/search', label: 'Skill search', icon: Search },
  ];
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-wb-line border-l-4 border-l-wb-blue bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/employer"
            className="inline-flex items-center gap-2 text-lg font-bold text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded"
          >
            <FileSearch className="h-5 w-5 text-wb-blue" strokeWidth={2} aria-hidden />
            <span>UNMAPPED</span>
            <span className="text-wb-ink/40">·</span>
            <span className="text-wb-ink/80">Employer</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {items.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded px-3 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wb-blue ${
                    active
                      ? 'bg-wb-blue/10 text-wb-navy'
                      : 'text-wb-ink/70 hover:text-wb-navy'
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
          <p className="hidden text-xs italic text-wb-ink/60 lg:block">
            &ldquo;Hire based on verified potential, not missing papers.&rdquo;
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-wb-ink/60 hover:text-wb-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Youth
          </Link>
        </div>
      </div>
    </header>
  );
}
