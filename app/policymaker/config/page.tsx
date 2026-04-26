'use client';

import { useState } from 'react';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

// White-label config UI. Policymaker pastes a JSON that matches the
// CountryConfig schema; we validate via /api/policymaker/validate-config
// and (in the prototype) apply it as a client-side override through the
// profile store. A real deployment wires this to authenticated persistence.

interface ValidationIssue {
  path: string;
  severity: 'error' | 'warning';
  message: string;
}

export default function ConfigPage() {
  const country = useProfile((s) => s.country);
  const [text, setText] = useState(() => JSON.stringify(COUNTRIES[country], null, 2));
  const [issues, setIssues] = useState<ValidationIssue[] | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pretending, setPretending] = useState<CountryCode | null>(null);

  async function validate() {
    setMessage(null);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch (e) {
      setIssues([{ path: '(root)', severity: 'error', message: 'invalid JSON: ' + String(e) }]);
      setOk(false);
      return;
    }
    const res = await fetch('/api/policymaker/validate-config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    setIssues(payload.issues);
    setOk(payload.ok);
  }

  function loadExisting(code: CountryCode) {
    setPretending(code);
    setText(JSON.stringify(COUNTRIES[code], null, 2));
    setIssues(null);
    setOk(null);
    setMessage(null);
  }

  function generateStub() {
    const stub = {
      code: 'XX',
      name: 'New country',
      locale: 'en',
      active: true,
      educationLevels: [
        { id: 'basic', label: 'Basic' },
        { id: 'secondary', label: 'Secondary' },
        { id: 'tertiary', label: 'Tertiary' },
      ],
      languages: [
        { code: 'en', label: 'English' },
      ],
      currencyLabel: 'USD',
      opportunityEmphasis: 'formal_training',
      broadbandPenetration: 50,
      routineTaskShare: 0.45,
      trainingProviders: ['[placeholder] vocational institute'],
    };
    setText(JSON.stringify(stub, null, 2));
    setIssues(null);
    setOk(null);
    setMessage(null);
  }

  return (
    <div>
      <BackButton href="/policymaker" label="Back to overview" className="mb-4" />
      <header>
        <h1 className="text-2xl font-semibold">White-label configuration</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Configure UNMAPPED for a new country without touching code. Paste
          or edit a <code>CountryConfig</code> JSON and validate. In a
          production deployment this form posts to an authenticated endpoint
          that persists the config server-side.
        </p>
      </header>

      <section className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Prototype scope:</strong> validation is real, but this preview
        applies the config client-side only. Production adds OAuth 2.0, per-tenant
        rate limiting, and a stable v1 contract — see the <code>/integrate</code> page.
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-wb-ink/70">Start from:</span>
        {(['GH', 'BD'] as CountryCode[]).map((c) => (
          <button
            key={c}
            onClick={() => loadExisting(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue ${
              pretending === c
                ? 'border-wb-navy bg-wb-navy text-white'
                : 'border-wb-line bg-white text-wb-ink hover:border-wb-blue'
            }`}
          >
            {COUNTRIES[c].name}
          </button>
        ))}
        <button
          onClick={generateStub}
          className="rounded-full border border-wb-line bg-white px-3 py-1 text-xs font-medium text-wb-ink hover:border-wb-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
        >
          Blank template
        </button>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-wb-navy">Config JSON</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 h-[420px] w-full rounded-lg border border-wb-line bg-white p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-wb-blue"
            spellCheck={false}
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={validate} icon={CheckCircle2}>
              Validate
            </Button>
            {ok && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-900">
                Config is valid · would ship as-is
              </span>
            )}
            {ok === false && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs text-red-900">
                Config has errors
              </span>
            )}
          </div>
          {message && <p className="mt-2 text-sm text-neutral-700">{message}</p>}
        </div>

        <div>
          <h3 className="text-sm font-medium">Validation report</h3>
          {issues == null && (
            <p className="mt-2 text-sm text-neutral-600">
              Paste a config on the left and click <em>Validate</em>.
            </p>
          )}
          {issues != null && issues.length === 0 && (
            <p className="mt-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              No issues found. All required fields present and in range.
            </p>
          )}
          {issues != null && issues.length > 0 && (
            <ul className="mt-2 space-y-2 text-sm">
              {issues.map((i, idx) => (
                <li
                  key={idx}
                  className={`rounded border p-3 ${
                    i.severity === 'error'
                      ? 'border-red-300 bg-red-50 text-red-900'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  }`}
                >
                  <strong>{i.severity.toUpperCase()}</strong>{' '}
                  <code className="text-xs">{i.path}</code> — {i.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
