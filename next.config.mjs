import createNextIntlPlugin from 'next-intl/plugin';
import pwa from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Dev builds skip PWA (next-pwa's dev mode is noisy). Production builds
// register a service worker that caches the youth flow per §10.
const withPWA = pwa({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  register: true,
  skipWaiting: true,
  // Cache the committed data JSONs with a stale-while-revalidate so a
  // dropped connection still shows the last-seen opportunities.
  runtimeCaching: [
    {
      urlPattern: /^\/data\/.*\.json$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'unmapped-data',
        expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^\/api\/skills-catalog$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'unmapped-catalog' },
    },
    {
      urlPattern: /^\/api\/match$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'unmapped-match',
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(withNextIntl(nextConfig));
