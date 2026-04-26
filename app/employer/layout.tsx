import type { ReactNode } from 'react';
import { EmployerHeader } from '@/components/EmployerHeader';

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <EmployerHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
