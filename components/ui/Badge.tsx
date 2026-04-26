import { ReactNode } from 'react';

export type BadgeVariant = 'verified' | 'self' | 'demand' | 'tampered';

export function Badge({ variant, children, className = '' }: { variant: BadgeVariant; children: ReactNode; className?: string }) {
  const base = "rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1";
  const variants = {
    verified: "bg-ys-teal/15 text-ys-teal",
    self: "bg-wb-line text-wb-ink",
    demand: "bg-ys-amber/20 text-wb-ink",
    tampered: "bg-ys-coral/15 text-ys-coral",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
