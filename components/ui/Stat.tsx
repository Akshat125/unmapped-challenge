import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { SourceLabel } from './SourceLabel';

export function Stat({
  label,
  value,
  source,
  year,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  source?: string;
  year?: number;
  icon?: LucideIcon;
  trend?: { direction: 'up' | 'down' | 'flat'; text: string };
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-widest text-wb-ink/60">{label}</div>
        {Icon && <Icon className="h-4 w-4 flex-none text-wb-ink/40" strokeWidth={1.75} aria-hidden />}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-wb-ink">{value}</div>
      {trend && (
        <div
          className={`mt-1 text-xs font-medium ${
            trend.direction === 'up'
              ? 'text-ys-teal'
              : trend.direction === 'down'
                ? 'text-ys-coral'
                : 'text-wb-ink/60'
          }`}
        >
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '·'} {trend.text}
        </div>
      )}
      {source && (
        <div className="mt-auto pt-2">
          <SourceLabel year={year}>{source}</SourceLabel>
        </div>
      )}
    </Card>
  );
}
