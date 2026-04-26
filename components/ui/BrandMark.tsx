import Link from 'next/link';

interface BrandMarkProps {
  subtitle?: string;
  href?: string;
  tone?: 'light' | 'dark';
}

export function BrandMark({ subtitle, href = '/', tone = 'light' }: BrandMarkProps) {
  const wordColor = tone === 'dark' ? 'text-white' : 'text-wb-navy';
  const dotColor = tone === 'dark' ? 'text-white/40' : 'text-wb-ink/40';
  const subtitleColor = tone === 'dark' ? 'text-white/80' : 'text-wb-ink/70';
  const ring = tone === 'dark' ? 'focus-visible:ring-ys-teal' : 'focus-visible:ring-wb-blue';

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded text-xl font-bold tracking-tight focus:outline-none focus-visible:ring-2 ${wordColor} ${ring}`}
    >
      {/* Logo mark — rounded square with layered gradient + subtle inner shine */}
      <span aria-hidden className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
        style={{
          background: 'linear-gradient(145deg, #003580 0%, #0060B0 45%, #009FDF 75%, #00A499 100%)',
        }}
      >
        {/* White "U" cut-out shape — simple pin shape suggesting location / person */}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="h-4 w-4"
          aria-hidden
        >
          <path
            d="M4 3 v6 a4 4 0 0 0 8 0 V3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span>UNMAPPED</span>

      {subtitle && (
        <>
          <span className={`text-lg font-normal ${dotColor}`} aria-hidden>·</span>
          <span className={`text-base font-semibold ${subtitleColor}`}>{subtitle}</span>
        </>
      )}
    </Link>
  );
}
