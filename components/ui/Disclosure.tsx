import { ReactNode } from 'react';

// Zero-JS disclosure — a styled <details> element. Works on 5-year-old
// Android, respects keyboard focus, prints expanded by default because the
// print stylesheet doesn't suppress it. Two visual variants:
//
//   'default' — subtle underlined trigger, used inline for per-item
//               reveals (e.g., "Show the standard code (ISCO-08 7422)")
//   'card'    — framed trigger with a chevron, used for major sections
//               (e.g., "Show how we calculated this" on the risk lens)

interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'card';
  defaultOpen?: boolean;
  className?: string;
}

export function Disclosure({
  summary,
  children,
  variant = 'default',
  defaultOpen = false,
  className = '',
}: DisclosureProps) {
  if (variant === 'card') {
    return (
      <details
        open={defaultOpen}
        className={`group rounded border border-wb-line bg-white ${className}`}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-wb-navy focus:outline-none focus:ring-2 focus:ring-wb-blue">
          <span>{summary}</span>
          <span
            aria-hidden
            className="select-none text-wb-ink/40 transition-transform group-open:rotate-90"
          >
            ▸
          </span>
        </summary>
        <div className="border-t border-wb-line px-4 py-3 text-sm text-wb-ink/80">
          {children}
        </div>
      </details>
    );
  }

  return (
    <details
      open={defaultOpen}
      className={`group text-sm ${className}`}
    >
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-wb-blue underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue focus-visible:ring-offset-2 rounded">
        <span
          aria-hidden
          className="select-none text-[11px] text-wb-ink/50 transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        <span>{summary}</span>
      </summary>
      <div className="mt-2 text-wb-ink/80">{children}</div>
    </details>
  );
}
