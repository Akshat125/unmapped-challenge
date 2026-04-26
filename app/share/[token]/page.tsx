'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { decodeShareToken } from '@/lib/share-token';
import { validateProfileV1 } from '@/lib/profile-schema';
import { ProfilePassportView } from '@/components/ProfilePassportView';
import { BrandMark } from '@/components/ui/BrandMark';
import { LinkButton } from '@/components/ui/LinkButton';
import { ArrowRight } from 'lucide-react';

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const decoded = useMemo(() => decodeShareToken(token), [token]);
  const validation = useMemo(
    () => (decoded ? validateProfileV1(decoded) : { ok: false, issues: [] }),
    [decoded],
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-wb-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <BrandMark />
          <LinkButton
            href="/employer"
            variant="secondary"
            size="sm"
            iconRight={ArrowRight}
          >
            Open in employer decoder
          </LinkButton>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
          Shared Digital Skill Passport
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-wb-navy">
          A candidate has shared their profile with you
        </h1>

        <div className="mt-6 rounded-lg border border-ys-amber bg-ys-amber/10 p-4 text-sm text-wb-ink">
          <strong>Read-only share link.</strong> The full profile was encoded
          into this URL by the subject. Prototype scope: a production deployment
          uses signed, short-lived tokens with server-side audit.
        </div>

        {!decoded && (
          <div className="mt-6 rounded-lg border border-ys-coral bg-ys-coral/10 p-4 text-sm text-ys-coral">
            This share link could not be decoded. It may be truncated.
          </div>
        )}

        {decoded && !validation.ok && (
          <div className="mt-6 rounded-lg border border-ys-coral bg-ys-coral/10 p-4 text-sm text-ys-coral">
            Decoded payload is not a valid <code>unmapped.profile/v1</code> document.
            <ul className="mt-2 list-disc pl-5">
              {validation.issues.map((i, idx) => (
                <li key={idx}>
                  <code>{i.path}</code> — {i.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {decoded && validation.ok && (
          <div className="mt-6 rounded-lg border border-wb-line bg-white p-6 shadow-sm">
            <ProfilePassportView profile={decoded} />
          </div>
        )}
      </main>
    </div>
  );
}
