'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { validateProfileV1, type ProfileV1 } from '@/lib/profile-schema';
import { decodeShareToken } from '@/lib/share-token';
import { verifyProfileSignatures, summarizeFailed } from '@/lib/verify-signatures';
import { useEmployerStore } from '@/lib/employer-store';
import { useCatalog } from '@/lib/catalog-client';
import { useMarketSignalStore } from '@/lib/market-signal-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Disclosure } from '@/components/ui/Disclosure';
import { BackButton } from '@/components/ui/BackButton';

// Step 3 of the Employer wizard: "Here are the people who match."
//
// Plain-language talent cards — no ISCO codes on the surface, no math
// tooltips. Match counts appear as horizontal progress bars. Signature
// integrity is summarized (green/red badge) with the hex hash hidden
// behind an "Is this profile authentic?" disclosure.

interface IntakeIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

export default function EmployerCandidates() {
  const router = useRouter();
  const catalog = useCatalog();
  const candidates = useEmployerStore((s) => s.candidates);
  const addCandidate = useEmployerStore((s) => s.addCandidate);
  const rateCandidate = useEmployerStore((s) => s.rateCandidate);
  const removeCandidate = useEmployerStore((s) => s.removeCandidate);
  const recentJds = useMarketSignalStore((s) => s.recentJds);

  const latestJd = recentJds[0] ?? null;
  const wanted = new Set(latestJd?.esco_skills ?? []);

  const [pasted, setPasted] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [issues, setIssues] = useState<IntakeIssue[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showImport, setShowImport] = useState(candidates.length === 0);

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
        message: `Loaded. Verifications: ${sigs.passed} of ${sigs.total} checked out.`,
      },
    ]);
  }

  async function handleText(text: string, source: string) {
    setIssues(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setIssues([{ path: source, severity: 'error', message: 'Not a valid profile file' }]);
      return;
    }
    const result = validateProfileV1(parsed);
    if (!result.ok) {
      setIssues(
        result.issues.length
          ? result.issues
          : [{ path: source, severity: 'error', message: 'Not a valid profile file' }],
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
      setIssues([{ path: 'share link', severity: 'error', message: "We couldn't open that link." }]);
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

  const ranked = candidates
    .map((c) => {
      const signals = new Set(c.profile.signals.map((s) => s.skill_code));
      const verified = new Set(c.profile.verifications.map((v) => v.skill_code));
      let vCount = 0;
      let sCount = 0;
      let missing = 0;
      for (const uri of wanted) {
        if (verified.has(uri)) vCount += 1;
        else if (signals.has(uri)) sCount += 1;
        else missing += 1;
      }
      // If no JD has been mapped yet, show absolute counts instead of
      // match-against-demand.
      const total = wanted.size || c.profile.signals.length;
      return {
        record: c,
        total,
        verified: vCount,
        self: sCount,
        missing: wanted.size ? missing : 0,
        score: wanted.size ? 2 * vCount + sCount : vCount,
      };
    })
    .sort((a, b) => b.score - a.score);

  const catalogLabels = new Map(catalog?.skills.map((s) => [s.uri, s.label]) ?? []);

  return (
    <div className="space-y-8">
      <BackButton href="/employer/jd" label="Back to what we understood" />
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-wb-navy md:text-4xl">
          Here are the people who match.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-wb-ink/70">
          {wanted.size > 0
            ? `Ranked against ${latestJd ? 'the role you just described' : 'your job description'}. Verified skills count more than self-reported ones.`
            : 'Your shortlist appears here once you add candidate profiles.'}
        </p>
      </header>

      {/* Import panel — visible by default when shortlist is empty; toggleable otherwise. */}
      {!showImport && (
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 rounded border border-wb-line bg-white px-3 py-2 text-sm text-wb-navy hover:border-wb-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
        >
          <Upload className="h-4 w-4" aria-hidden />
          Add another profile
        </button>
      )}

      {showImport && (
        <Card className="max-w-4xl">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-wb-navy">
              Add candidate profiles
            </h2>
            {candidates.length > 0 && (
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="text-xs text-wb-ink/50 underline hover:text-wb-blue"
              >
                Hide
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-wb-ink/70">
            Candidates send you a one-time share link or a profile file. You
            paste it here. Nothing is re-uploaded anywhere.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? 'border-wb-blue bg-wb-blue/5' : 'border-wb-line bg-white'
              }`}
            >
              <Upload className="h-6 w-6 text-wb-ink/40" strokeWidth={1.75} aria-hidden />
              <p className="mt-3 text-sm font-medium text-wb-navy">
                Drop a profile file here
              </p>
              <p className="mt-1 text-xs text-wb-ink/60">
                Or click to upload
              </p>
              <input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.currentTarget.value = '';
                }}
                className="mt-4 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-wb-navy file:px-3 file:py-2 file:text-white hover:file:bg-wb-ink"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-wb-ink/60">
                  Share link
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={shareUrl}
                    onChange={(e) => setShareUrl(e.target.value)}
                    placeholder="Paste the link"
                    className="flex-1 rounded border border-wb-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wb-blue"
                  />
                  <Button size="sm" onClick={handleShareUrl}>
                    Open
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-wb-ink/60">
                  Paste profile JSON
                </label>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-wb-line bg-white p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-wb-blue"
                  placeholder='{ "schema": "unmapped.profile/v1", ... }'
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleText(pasted, 'pasted JSON')}
                  disabled={!pasted.trim()}
                  className="mt-2 disabled:opacity-50"
                >
                  Use this profile
                </Button>
              </div>
            </div>
          </div>
          {issues && issues.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm">
              {issues.map((i, idx) => (
                <li
                  key={idx}
                  className={`rounded border p-3 ${
                    i.severity === 'error'
                      ? 'border-ys-coral bg-ys-coral/10 text-ys-coral'
                      : 'border-ys-teal bg-ys-teal/10 text-ys-teal'
                  }`}
                >
                  <strong>{i.severity === 'error' ? 'Error' : 'Loaded'}</strong> ·{' '}
                  {i.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Talent cards — the main content. */}
      {candidates.length === 0 ? (
        <p className="rounded border border-dashed border-wb-line bg-white p-8 text-center text-sm text-wb-ink/60">
          Once you add a profile, a talent card appears here. Try dropping
          one of your youth profiles from the shortlist share link.
        </p>
      ) : (
        <ul className="space-y-4">
          {ranked.map(({ record, verified, self, missing, total, score }) => {
            const { profile } = record;
            const tampered = record.signature_checks.failed_signatures.length > 0;
            const sigTotal = record.signature_checks.total;
            const displayName = profile.subject.display_name ?? 'Anonymous candidate';
            const topline = `${verified + self} of ${Math.max(1, total)} skills match`;
            const pct = Math.min(100, ((verified + self) / Math.max(1, total)) * 100);
            const oneLiner =
              profile.subject.self_report.work_text ??
              `Profile from ${profile.country}.`;
            const verifierNote = profile.verifications[0]
              ? ` Verified by ${profile.verifications[0].navigator_name}.`
              : '';
            return (
              <li
                key={record.id}
                className="rounded-lg border border-wb-line bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="text-xl font-semibold text-wb-navy">
                        {displayName}
                      </h3>
                      <span className="text-xs text-wb-ink/60">
                        {profile.country}
                      </span>
                      {tampered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ys-coral/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ys-coral">
                          <AlertTriangle className="h-3 w-3" aria-hidden />
                          Verification failed
                        </span>
                      ) : sigTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-ys-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ys-teal">
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                          {sigTotal} verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-wb-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-wb-ink/60">
                          Self-reported only
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm italic text-wb-ink/80">
                      &ldquo;
                      {oneLiner.length > 140 ? oneLiner.slice(0, 137) + '…' : oneLiner}
                      &rdquo;
                      {verifierNote && (
                        <span className="not-italic text-wb-ink/60">{verifierNote}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={record.rating ?? ''}
                      onChange={(e) =>
                        rateCandidate(
                          record.id,
                          (e.target.value || undefined) as
                            | 'shortlist'
                            | 'reject'
                            | 'review'
                            | undefined,
                        )
                      }
                      className="rounded border border-wb-line bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-wb-blue"
                      aria-label="Rating"
                    >
                      <option value="">— action —</option>
                      <option value="shortlist">Shortlist</option>
                      <option value="review">Review later</option>
                      <option value="reject">Pass</option>
                    </select>
                    <Link
                      href={`/employer/${encodeURIComponent(record.id)}`}
                      className="rounded border border-wb-navy bg-white px-3 py-2 text-xs font-medium text-wb-navy hover:bg-wb-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
                    >
                      Open profile
                    </Link>
                    <button
                      onClick={() => removeCandidate(record.id)}
                      className="rounded border border-wb-line bg-white px-2 py-2 text-xs text-wb-ink/60 hover:border-ys-coral hover:text-ys-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
                      aria-label="Remove from shortlist"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Match progress bar */}
                <div className="mt-5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-wb-ink">{topline}</span>
                    {wanted.size > 0 && (
                      <span className="text-xs text-wb-ink/60">
                        {verified} proven · {self} self-reported
                        {missing > 0 ? ` · ${missing} missing` : ''}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-wb-line">
                    <div
                      className="h-full rounded-full bg-ys-teal"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                </div>

                {/* Disclosures: how we rank, signature details. */}
                <div className="mt-5 grid gap-3 border-t border-wb-line pt-4 md:grid-cols-2">
                  <Disclosure summary="How do we rank these?" variant="default">
                    <p>
                      We count the skills the candidate can demonstrate. A
                      skill that another person has verified counts twice.
                      A skill that&rsquo;s only self-reported counts once.
                      No rank depends on degrees or certificates.
                    </p>
                  </Disclosure>
                  <Disclosure summary="Is this profile authentic?" variant="default">
                    {sigTotal === 0 ? (
                      <p>
                        This profile has no outside verifications yet. That
                        doesn&rsquo;t make it wrong — it means you&rsquo;re
                        relying on self-report and your own interview.
                      </p>
                    ) : tampered ? (
                      <p>
                        <strong>Warning.</strong>{' '}
                        {record.signature_checks.failed_signatures.length} of{' '}
                        {sigTotal} verifications don&rsquo;t match their
                        signature recipe. The profile may have been edited
                        after the NGO signed it.
                      </p>
                    ) : (
                      <p>
                        All {sigTotal} outside verifications match their
                        signature recipe exactly — the skills named are
                        genuinely the ones the NGO confirmed.
                      </p>
                    )}
                  </Disclosure>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {wanted.size === 0 && candidates.length > 0 && (
        <p className="max-w-3xl rounded border border-wb-line bg-wb-sand p-4 text-sm text-wb-ink/80">
          Tip: describe the job you&rsquo;re hiring for on the{' '}
          <Link href="/employer/jd" className="text-wb-blue underline">
            previous step
          </Link>
          {' '}
          so we can rank candidates against it.
        </p>
      )}
    </div>
  );
}
