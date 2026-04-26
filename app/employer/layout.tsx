import type { ReactNode } from 'react';
import { EmployerHeader } from '@/components/EmployerHeader';

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wb-sand/40">
      <EmployerHeader />
      <main className="mx-auto w-full max-w-[80rem] px-6 py-10">{children}</main>
    </div>
  );
}
