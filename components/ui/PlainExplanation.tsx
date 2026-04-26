'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

// Tappable "?" affordance with a plain-language tooltip. Hover opens it on
// desktop; tap/focus opens it on touch. Falls back to the native title
// attribute if JS is cold, so the explanation is always reachable.

interface PlainExplanationProps {
  term: ReactNode;
  explanation: string;
  className?: string;
}

export function PlainExplanation({ term, explanation, className = '' }: PlainExplanationProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={wrapRef} className={`relative inline-flex items-baseline gap-1 ${className}`}>
      <span>{term}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        title={explanation}
        aria-expanded={open}
        aria-label={`What is ${typeof term === 'string' ? term : 'this'}?`}
        className="inline-flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full border border-wb-line text-[10px] font-semibold text-wb-ink/60 hover:border-wb-blue hover:text-wb-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-1"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded border border-wb-line bg-white p-3 text-xs leading-relaxed text-wb-ink shadow-md"
        >
          {explanation}
        </span>
      )}
    </span>
  );
}
