import type { ReactNode } from 'react';
import { NavigatorHeader } from '@/components/NavigatorHeader';

export default function NavigatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <NavigatorHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
