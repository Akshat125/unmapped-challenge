import type { ReactNode } from 'react';
import { YouthHeader } from '@/components/YouthHeader';

export default function YouthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <YouthHeader />
      <main className="mx-auto w-full max-w-[64rem] px-6 py-10">{children}</main>
    </>
  );
}
