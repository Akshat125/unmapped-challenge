import { Card } from './Card';
import { SourceLabel } from './SourceLabel';

export function Stat({
  label,
  value,
  source,
  year,
}: {
  label: string;
  value: string;
  source?: string;
  year?: number;
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-widest text-wb-ink/70">{label}</div>
      <div className="mt-1 text-2xl font-bold text-wb-ink">{value}</div>
      <SourceLabel year={year}>{source}</SourceLabel>
    </Card>
  );
}
