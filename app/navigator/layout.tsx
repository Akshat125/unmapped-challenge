import type { ReactNode } from 'react';
import { NavigatorHeader } from '@/components/NavigatorHeader';

export default function NavigatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wb-sand/60">
      <NavigatorHeader />
      <main className="mx-auto w-full max-w-[80rem] px-6 py-10">{children}</main>
    </div>
  );
}
