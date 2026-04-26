import type { ReactNode } from 'react';
import { YouthHeader } from '@/components/YouthHeader';

export default function YouthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <YouthHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </>
  );
}
