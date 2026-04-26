import type { ReactNode } from 'react';
import { PolicymakerHeader } from '@/components/PolicymakerHeader';

export default function PolicymakerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <PolicymakerHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
