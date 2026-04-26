import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'UNMAPPED',
  description: 'Skills signal engine and opportunity matching for LMIC youth.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#002244',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-wb-sand text-wb-ink font-sans antialiased">{children}</body>
    </html>
  );
}
