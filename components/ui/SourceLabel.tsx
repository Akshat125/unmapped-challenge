import { ReactNode } from 'react';

export function SourceLabel({ children, year }: { children: ReactNode; year?: number }) {
  if (!children) return null;
  return (
    <div className="mt-1 text-xs text-wb-ink/60 italic">
      {children}{year ? ` · ${year}` : ''}
    </div>
  );
}
