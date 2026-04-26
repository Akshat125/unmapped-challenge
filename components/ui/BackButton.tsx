'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// Consistent "back" affordance. Two modes:
//   - `href` provided: renders as a Link. Preferred, because it gives the
//     browser predictable history and works without JS.
//   - `href` absent: falls back to router.back() — used on detail pages
//     where the "previous" route is whatever the user came from.
//
// Tone 'dark' is for the Policymaker navy shell.

interface BackButtonProps {
  href?: string;
  label?: string;
  tone?: 'light' | 'dark';
  className?: string;
}

export function BackButton({
  href,
  label = 'Back',
  tone = 'light',
  className = '',
}: BackButtonProps) {
  const router = useRouter();
  const styles =
    tone === 'dark'
      ? 'text-white/70 hover:text-white'
      : 'text-wb-ink/60 hover:text-wb-navy';

  const content = (
    <>
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      <span>{label}</span>
    </>
  );

  const classes = `inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={classes}>
      {content}
    </button>
  );
}
