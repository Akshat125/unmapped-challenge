'use client';

import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

// Plain-SVG QR render. No canvas, no heavy libs — spec §3 explicitly warns
// against them for 5-year-old Android browsers. qrcode-generator is ~15KB
// and outputs the module matrix we draw ourselves as SVG <rect>s.
export function QRCodeView({ data, size = 192 }: { data: string; size?: number }) {
  const svg = useMemo(() => {
    // Error-correction level M balances density + scannability. Version 0
    // lets the lib pick automatically up to version 40.
    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();
    const modules = qr.getModuleCount();
    const cell = size / modules;
    const rects: string[] = [];
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (qr.isDark(r, c)) {
          rects.push(
            `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" ` +
              `width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="#0b0f14"/>`,
          );
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Shareable skill passport QR code"><rect width="${size}" height="${size}" fill="#ffffff"/>${rects.join('')}</svg>`;
  }, [data, size]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
