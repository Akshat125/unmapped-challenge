'use client';

import Link from 'next/link';
import { useState } from 'react';
import { validateProfileV1, type ProfileV1 } from '@/lib/profile-schema';
import { decodeShareToken } from '@/lib/share-token';
import { verifyProfileSignatures, summarizeFailed } from '@/lib/verify-signatures';
import { useEmployerStore } from '@/lib/employer-store';

// Skill-First Candidate Decoder. Drop a ProfileV1 JSON (from file, paste,
// or a share link). We validate, verify signatures, and show verified-green
// skills vs self-reported ones. Shortlist persists to localStorage.

interface IntakeIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

export default function EmployerHome() {
  const candidates = useEmployerStore((s) => s.candidates);
  const addCandidate = useEmployerStore((s) => s.addCandidate);
  const rateCandidate = useEmployerStore((s) => s.rateCandidate);
  const removeCandidate = useEmployerStore((s) => s.removeCandidate);
  const clear = useEmployerStore((s) => s.clear);

  const [pasted, setPasted] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [issues, setIssues] = useState<IntakeIssue[] | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function ingest(payload: ProfileV1, source: string) {
    const sigs = await verifyProfileSignatures(payload);
    addCandidate(payload, {
      total: sigs.total,
      passed: sigs.passed,
      failed_signatures: summarizeFailed(sigs.failed),
    });
    setIssues([
      {
        path: source,
        severity: 'warning',
        message: `Ingested. Signatures: ${sigs.passed}/${sigs.total} valid.`,
      },
    ]);
  }

  async function handleText(text: string, source: string) {
    setIssues(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setIssues([{ path: source, severity: 'error', message: 'Not valid JSON' }]);
      return;
    }
    const result = validateProfileV1(parsed);
    if (!result.ok) {
      setIssues(
        result.issues.length
          ? result.issues
          : [{ path: source, severity: 'error', message: 'Invalid profile schema' }],
      );
      return;
    }
    await ingest(parsed as ProfileV1, source);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    await handleText(text, file.name);
  }

  async function handleShareUrl() {
    if (!shareUrl.trim()) return;
    const m = shareUrl.match(/\/share\/([^/?#]+)/);
    const token = m ? m[1] : shareUrl.trim();
    const decoded = decodeShareToken(token);
    if (!decoded) {
      setIssues([{ path: 'share_url', severity: 'error', message: 'Could not decode share link' }]);
      return;
    }
    const result = validateProfileV1(decoded);
    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    await ingest(decoded, 'share link');
    setShareUrl('');
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Skill-first decoder for <code>unmapped.profile/v1</code> documents.
          Green = navigator-verified; white = self-reported.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`rounded-lg border-2 border-dashed p-8 text-center ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-neutral-300 bg-white'
          }`}
        >
          <p className="text-sm font-medium">Drop a profile JSON here</p>
          <p className="mt-1 text-xs text-neutral-600">
            Or click to upload · or paste / share link below
          </p>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.currentTarget.value = '';
            }}
            className="mt-4 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-2 file:text-white"
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase text-neutral-600">Share link</label>
            <div className="mt-1 flex gap-2">
              <input
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="https://…/share/…"
                className="flex-1 rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={handleShareUrl}
                className="rounded bg-ink px-3 py-2 text-sm text-white"
              >
                Decode
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-neutral-600">Paste JSON</label>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded border border-neutral-300 bg-white p-2 font-mono text-xs"
              placeholder='{ "schema": "unmapped.profile/v1", ... }'
            />
            <button
              onClick={() => handleText(pasted, 'pasted JSON')}
              disabled={!pasted.trim()}
              className="mt-1 rounded bg-ink px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Parse
            </button>
          </div>
        </div>
      </section>

      {issues && issues.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {issues.map((i, idx) => (
            <li
              key={idx}
              className={`rounded border p-2 ${
                i.severity === 'error'
                  ? 'border-red-300 bg-red-50 text-red-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              <strong>{i.severity}</strong> · <code>{i.path}</code> — {i.message}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Shortlist ({candidates.length})</h2>
          {candidates.length > 0 && (
            <button onClick={clear} className="text-xs text-neutral-500 underline">
              Clear all
            </button>
          )}
        </div>
        {candidates.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-600">
            No candidates yet. Drop a profile JSON above to begin building your
            shortlist.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {candidates.map((c) => {
              const sig = c.signature_checks;
              const tampered = sig.failed_signatures.length > 0;
              const skillCount = c.profile.signals.length;
              const verifiedCount = c.profile.verifications.length;
              return (
                <li
                  key={c.id}
                  className="rounded border border-neutral-300 bg-white p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">
                        {c.profile.subject.display_name ?? 'Anonymous candidate'}
                      </h3>
                      <p className="text-xs text-neutral-600">
                        {c.profile.country} · {skillCount} skill
                        {skillCount === 1 ? '' : 's'} · {verifiedCount} verified
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {tampered && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-900">
                          Signature mismatch
                        </span>
                      )}
                      {!tampered && sig.total > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">
                          {sig.passed}/{sig.total} signatures valid
                        </span>
                      )}
                      <select
                        value={c.rating ?? ''}
                        onChange={(e) =>
                          rateCandidate(
                            c.id,
                            (e.target.value || undefined) as 'shortlist' | 'reject' | 'review' | undefined,
                          )
                        }
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">— rate —</option>
                        <option value="shortlist">Shortlist</option>
                        <option value="review">Review</option>
                        <option value="reject">Reject</option>
                      </select>
                      <Link
                        href={`/employer/${encodeURIComponent(c.id)}`}
                        className="rounded border border-ink bg-white px-2 py-1 text-xs"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => removeCandidate(c.id)}
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
