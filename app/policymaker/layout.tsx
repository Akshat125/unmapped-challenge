import type { ReactNode } from 'react';
import { PolicymakerHeader } from '@/components/PolicymakerHeader';

export default function PolicymakerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wb-sand/40">
      <PolicymakerHeader />
      <main className="mx-auto w-full max-w-[90rem] px-6 py-10">{children}</main>
    </div>
  );
}
