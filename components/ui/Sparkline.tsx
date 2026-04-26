'use client';

// Minimal dependency-free sparkline — a single SVG path, no Recharts cost
// on pages that don't already import it. ~40 bytes of rendered output per
// instance. Positive values only; caller normalizes if needed.
export function Sparkline({
  values,
  stroke = '#00A499',
  fill = 'rgba(0, 164, 153, 0.15)',
  width = 140,
  height = 40,
  strokeWidth = 1.75,
}: {
  values: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray="2 4"
          opacity={0.4}
        />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - strokeWidth * 2) - strokeWidth;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = 'M' + points.join(' L');
  const area =
    line +
    ` L${width.toFixed(1)},${height.toFixed(1)} L0,${height.toFixed(1)} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
