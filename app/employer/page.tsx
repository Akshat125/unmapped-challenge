'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, ListFilter, ArrowRight } from 'lucide-react';
import { useEmployerStore } from '@/lib/employer-store';

// Step 1 of the Employer linear wizard: "Who are you hiring for?"
//
// Two tiles. Left tile recommended (free-text job description → ESCO/ISCO
// mapping → Transparency View). Right tile still reachable (granular skill
// filtering) but visually muted to 60% opacity.
//
// No ISCO/ESCO jargon visible on this surface. Everything speaks in
// employer verbs.

export default function EmployerStep1() {
  const router = useRouter();
  const candidates = useEmployerStore((s) => s.candidates);

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-wb-navy md:text-4xl">
          Who are you hiring for?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-wb-ink/70">
          Two quick ways to start. Both land on the same matches.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => router.push('/employer/jd')}
          className="group relative flex h-full flex-col gap-5 rounded-lg border border-wb-navy bg-white p-7 text-left shadow-sm transition-colors hover:border-wb-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2"
        >
          <span className="absolute right-5 top-5 rounded-full bg-ys-teal/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ys-teal">
            recommended
          </span>
          <FileText className="h-7 w-7 text-wb-blue" strokeWidth={1.75} aria-hidden />
          <div>
            <h2 className="text-xl font-semibold text-wb-navy">
              Describe the job in your own words
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-wb-ink/70">
              Paste a job ad or write a few lines. We&rsquo;ll translate it to
              standard roles and show you who matches — with a transparent
              view of how we got there.
            </p>
          </div>
          <div className="mt-auto inline-flex items-center gap-2 border-t border-wb-line pt-4 text-sm font-medium text-wb-navy group-hover:text-wb-blue">
            Start here
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/employer/search')}
          className="group flex h-full flex-col gap-5 rounded-lg border border-wb-line bg-white p-7 text-left shadow-sm opacity-70 transition-all hover:opacity-100 hover:border-wb-blue focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2"
        >
          <ListFilter className="h-7 w-7 text-wb-ink/50 group-hover:text-wb-blue" strokeWidth={1.75} aria-hidden />
          <div>
            <h2 className="text-xl font-semibold text-wb-navy">
              Pick from standard roles
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-wb-ink/70">
              Choose an occupation group and filter by the skills you need.
              Faster if you already know exactly what you&rsquo;re hiring
              for.
            </p>
          </div>
          <div className="mt-auto inline-flex items-center gap-2 border-t border-wb-line pt-4 text-sm font-medium text-wb-ink/70 group-hover:text-wb-blue">
            Browse roles
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
        </button>
      </section>

      <p className="max-w-3xl text-sm text-wb-ink/60">
        New here? Start with &ldquo;Describe the job in your own words&rdquo;
        — most employers do.
      </p>

      {candidates.length > 0 && (
        <section className="rounded border border-wb-line bg-wb-sand p-5">
          <p className="text-sm text-wb-ink/80">
            You already have <strong>{candidates.length}</strong> candidate
            {candidates.length === 1 ? '' : 's'} on your shortlist.{' '}
            <Link
              href="/employer/candidates"
              className="font-medium text-wb-blue hover:underline"
            >
              Jump to candidates →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
