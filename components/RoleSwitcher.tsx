'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

// The only cross-role bridge in a role-locked shell. Lives top-right of
// every role's header. Tapping it routes back to `/`, where the selector
// shows a "Continue as [current role]" shortcut plus the four tiles.

interface RoleSwitcherProps {
  tone?: 'light' | 'dark';
}

export function RoleSwitcher({ tone = 'light' }: RoleSwitcherProps) {
  const router = useRouter();

  const styles =
    tone === 'dark'
      ? 'border-white/20 text-white/70 hover:text-white hover:border-white/40 focus-visible:ring-ys-teal'
      : 'border-wb-line text-wb-ink/60 hover:text-wb-navy hover:border-wb-blue focus-visible:ring-wb-blue';

  return (
    <button
      type="button"
      onClick={() => router.push('/')}
      aria-label="Switch to a different role"
      title="Switch role"
      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 ${styles}`}
    >
      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      <span>Switch role</span>
    </button>
  );
}
