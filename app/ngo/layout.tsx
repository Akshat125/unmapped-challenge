import type { ReactNode } from 'react';
import { NgoHeader } from '@/components/NgoHeader';

export default function NgoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wb-sand/60">
      <NgoHeader />
      <main className="mx-auto w-full max-w-[80rem] px-6 py-10">{children}</main>
    </div>
  );
}
