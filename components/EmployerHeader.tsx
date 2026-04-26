'use client';

import Link from 'next/link';

export function EmployerHeader() {
  return (
    <header className="border-b border-wb-line border-l-4 border-l-wb-blue bg-white">
      <div className="mx-auto flex max-w-[64rem] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div>
          <Link href="/employer" className="text-lg font-bold tracking-tight text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            UNMAPPED · Employer
          </Link>
          <div className="text-xs text-wb-ink/60">Skill-First Candidate Decoder</div>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/employer" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Candidates
          </Link>
          <Link href="/employer/jd" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Job description
          </Link>
          <Link href="/employer/search" className="hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            Skill search
          </Link>
          <Link href="/" className="ml-4 text-xs text-wb-ink/60 hover:text-wb-blue focus:outline-none focus:ring-2 focus:ring-wb-blue rounded">
            ← Youth view
          </Link>
        </nav>
        <p className="hidden text-xs italic text-wb-ink/60 md:block">
          &ldquo;Hire based on verified potential, not missing papers.&rdquo;
        </p>
      </div>
    </header>
  );
}
