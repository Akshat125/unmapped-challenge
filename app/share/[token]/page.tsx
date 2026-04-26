'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { decodeShareToken } from '@/lib/share-token';
import { validateProfileV1 } from '@/lib/profile-schema';
import { ProfilePassportView } from '@/components/ProfilePassportView';

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const decoded = useMemo(() => decodeShareToken(token), [token]);
  const validation = useMemo(
    () => (decoded ? validateProfileV1(decoded) : { ok: false, issues: [] }),
    [decoded],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Link href="/employer" className="text-sm text-neutral-600 underline">
          Open in employer decoder →
        </Link>
        <Link href="/" className="text-sm text-neutral-600 underline">
          ← UNMAPPED
        </Link>
      </div>

      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Read-only share link.</strong> The full profile was encoded
        into this URL by the subject. Prototype scope: a production deployment
        uses signed, short-lived tokens with server-side audit.
      </div>

      {!decoded && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          This share link could not be decoded. It may be truncated.
        </div>
      )}

      {decoded && !validation.ok && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-900">
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
        <div className="mt-6 rounded border border-neutral-300 bg-white p-5">
          <ProfilePassportView profile={decoded} />
        </div>
      )}
    </div>
  );
}
