'use client';

import { useState } from 'react';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';
import { useProfile } from '@/lib/profile-store';

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
        <span>Start from:</span>
        {(['GH', 'BD', 'VN', 'KE', 'BR'] as CountryCode[]).map((c) => (
          <button
            key={c}
            onClick={() => loadExisting(c)}
            className={`rounded border px-3 py-1 ${
              pretending === c ? 'border-ink bg-ink text-white' : 'border-neutral-300 bg-white'
            }`}
          >
            {COUNTRIES[c].name}
          </button>
        ))}
        <button
          onClick={generateStub}
          className="rounded border border-neutral-300 bg-white px-3 py-1"
        >
          Blank template
        </button>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Config JSON</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 h-[420px] w-full rounded border border-neutral-300 bg-white p-3 font-mono text-xs"
            spellCheck={false}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={validate}
              className="rounded bg-ink px-4 py-2 text-sm text-white"
            >
              Validate
            </button>
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
