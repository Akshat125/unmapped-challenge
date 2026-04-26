import Link from 'next/link';

// Single brand identity used across every header. The role-zone is
// indicated by the subtitle only, never by swapping the logo itself.
// Tone 'dark' is for the Policymaker navy header; the small gradient
// square adjusts accent intensity accordingly.

interface BrandMarkProps {
  subtitle?: string;
  href?: string;
  tone?: 'light' | 'dark';
}

export function BrandMark({
  subtitle,
  href = '/',
  tone = 'light',
}: BrandMarkProps) {
  const wordColor = tone === 'dark' ? 'text-white' : 'text-wb-navy';
  const dotColor = tone === 'dark' ? 'text-white/40' : 'text-wb-ink/40';
  const subtitleColor = tone === 'dark' ? 'text-white/80' : 'text-wb-ink/80';
  const ring = tone === 'dark' ? 'focus-visible:ring-ys-teal' : 'focus-visible:ring-wb-blue';

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded text-lg font-bold tracking-tight focus:outline-none focus-visible:ring-2 ${wordColor} ${ring}`}
    >
      <span
        aria-hidden
        className="inline-block h-5 w-5 rounded"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #002244 0%, #009FDF 60%, #00A499 100%)',
        }}
      />
      <span>UNMAPPED</span>
      {subtitle && (
        <>
          <span className={dotColor} aria-hidden>·</span>
          <span className={`font-semibold ${subtitleColor}`}>{subtitle}</span>
        </>
      )}
    </Link>
  );
}
