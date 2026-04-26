'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useEmployerStore } from '@/lib/employer-store';
import { ProfilePassportView } from '@/components/ProfilePassportView';

export default function EmployerCandidateDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(params.id) : '';
  const candidate = useEmployerStore((s) => s.candidates.find((c) => c.id === id));
  const setNotes = useEmployerStore((s) => s.setNotes);
  const rateCandidate = useEmployerStore((s) => s.rateCandidate);
  const [notesDraft, setNotesDraft] = useState(candidate?.notes ?? '');

  if (!candidate) {
    return (
      <div>
        <p className="text-sm">Candidate not found.</p>
        <Link href="/employer" className="mt-3 inline-block underline">
          Back to shortlist
        </Link>
      </div>
    );
  }

  const { profile, signature_checks, rating } = candidate;
  const tampered = signature_checks.failed_signatures.length > 0;

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Link href="/employer" className="text-xs text-neutral-500 underline">
            ← Shortlist
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {profile.subject.display_name ?? 'Anonymous candidate'}
          </h1>
          <p className="text-xs text-neutral-600">
            Added {new Date(candidate.addedAt).toLocaleDateString()} · ID{' '}
            <code>{candidate.id.slice(0, 8)}…</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rating ?? ''}
            onChange={(e) =>
              rateCandidate(
                candidate.id,
                (e.target.value || undefined) as 'shortlist' | 'reject' | 'review' | undefined,
              )
            }
            className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— rate —</option>
            <option value="shortlist">Shortlist</option>
            <option value="review">Review</option>
            <option value="reject">Reject</option>
          </select>
        </div>
      </header>

      <section
        className={`mt-4 rounded border p-4 text-sm ${
          tampered
            ? 'border-red-300 bg-red-50 text-red-900'
            : signature_checks.total > 0
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-neutral-300 bg-white text-neutral-700'
        }`}
      >
        <strong>Signature verification:</strong>{' '}
        {signature_checks.total === 0
          ? 'No navigator verifications to check.'
          : tampered
            ? `${signature_checks.passed}/${signature_checks.total} valid — ${signature_checks.failed_signatures.length} mismatch. Treat unverified skills as self-reported only.`
            : `All ${signature_checks.total} navigator signatures verified against the canonical recipe.`}
      </section>

      <section className="mt-6 rounded border border-neutral-300 bg-white p-5">
        <ProfilePassportView profile={profile} />
      </section>

      <section className="mt-6 rounded border border-neutral-300 bg-white p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Hiring notes
        </h3>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => notesDraft !== candidate.notes && setNotes(candidate.id, notesDraft)}
          rows={4}
          className="mt-2 w-full rounded border border-neutral-300 bg-white p-2 text-sm"
          placeholder="Private notes — persisted locally only."
        />
      </section>
    </div>
  );
}
