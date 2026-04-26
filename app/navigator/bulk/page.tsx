'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useNavigatorStore } from '@/lib/navigator-store';
import { COUNTRIES, type CountryCode } from '@/lib/config/countries';

// Bulk intake — V3.0 §3 Group 3 "digitize skills for groups of youth
// simultaneously." Two modes:
//
//   1. Paste a CSV (display_name, country, work_text, tools_text, languages)
//   2. Hand-enter up to 8 rows at a time in a spreadsheet-style grid
//
// Each intake lands as a profile in the caseload. The navigator can then
// open each to add validations individually.

type Row = {
  displayName: string;
  country: CountryCode;
  workText: string;
  toolsText: string;
  languages: string;
};

const EMPTY_ROW: Row = {
  displayName: '',
  country: 'GH',
  workText: '',
  toolsText: '',
  languages: '',
};

export default function BulkIntake() {
  const addProfile = useNavigatorStore((s) => s.addProfile);
  const [rows, setRows] = useState<Row[]>(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((r) => [...r, { ...EMPTY_ROW }]);
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function commitRows(source: string, validRows: Row[]) {
    let created = 0;
    for (const r of validRows) {
      if (!r.displayName.trim()) continue;
      addProfile({
        displayName: r.displayName.trim(),
        country: r.country,
        workText: r.workText.trim() || undefined,
        toolsText: r.toolsText.trim() || undefined,
        languages: r.languages
          ? r.languages.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      created += 1;
    }
    setResult(`Imported ${created} profile${created === 1 ? '' : 's'} from ${source}.`);
  }

  function submitGrid() {
    commitRows('grid', rows);
    setRows(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
  }

  function submitCsv() {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    if (lines.length === 0) {
      setResult('CSV is empty.');
      return;
    }
    // First non-comment line is the header if it starts with "display_name"
    const header = lines[0].toLowerCase();
    const body = header.includes('display_name') ? lines.slice(1) : lines;
    const parsed: Row[] = body.map((line) => {
      const cells = line.split(',').map((c) => c.trim());
      const [displayName = '', country = 'GH', workText = '', toolsText = '', languages = ''] = cells;
      const c = (country.toUpperCase() as CountryCode) in COUNTRIES
        ? (country.toUpperCase() as CountryCode)
        : 'GH';
      return { displayName, country: c, workText, toolsText, languages };
    });
    commitRows('CSV', parsed);
    setCsv('');
  }

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link href="/navigator" className="text-xs text-neutral-500 underline">
            ← Your youth
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Bulk intake</h1>
          <p className="mt-1 text-sm text-neutral-700">
            Digitize several youth profiles at once. Use the grid for a handful
            or paste a CSV for a full cohort.
          </p>
        </div>
      </header>

      {result && (
        <div className="mt-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          {result}
        </div>
      )}

      <section className="mt-6 rounded border border-neutral-300 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Grid intake
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="text-left uppercase tracking-wide text-neutral-600">
                <th className="px-2 py-1">Name / alias</th>
                <th className="px-2 py-1">Country</th>
                <th className="px-2 py-1">Work done</th>
                <th className="px-2 py-1">Tools</th>
                <th className="px-2 py-1">Languages</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-neutral-200">
                  <td className="px-2 py-1">
                    <input
                      value={r.displayName}
                      onChange={(e) => updateRow(i, { displayName: e.target.value })}
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={r.country}
                      onChange={(e) => updateRow(i, { country: e.target.value as CountryCode })}
                      className="rounded border border-neutral-300 bg-white px-2 py-1"
                    >
                      {(Object.keys(COUNTRIES) as CountryCode[])
                        .filter((c) => COUNTRIES[c].active)
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={r.workText}
                      onChange={(e) => updateRow(i, { workText: e.target.value })}
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={r.toolsText}
                      onChange={(e) => updateRow(i, { toolsText: e.target.value })}
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={r.languages}
                      onChange={(e) => updateRow(i, { languages: e.target.value })}
                      placeholder="en, tw"
                      className="w-full rounded border border-neutral-300 bg-white px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        className="text-xs text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={addRow} className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm">
            + Row
          </button>
          <button onClick={submitGrid} className="rounded bg-ink px-3 py-1 text-sm text-white">
            Create profiles
          </button>
        </div>
      </section>

      <section className="mt-6 rounded border border-neutral-300 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
          CSV intake
        </h2>
        <p className="mt-1 text-xs text-neutral-600">
          Columns: <code>display_name, country, work_text, tools_text, languages</code>.
          Country = 2-letter code. Languages = semicolons-or-comma separated.
          First line is treated as a header if it starts with <code>display_name</code>.
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          className="mt-2 w-full rounded border border-neutral-300 bg-white p-2 font-mono text-xs"
          placeholder="display_name,country,work_text,tools_text,languages&#10;Amara,GH,I fix phones,soldering iron Android,en;tw"
        />
        <button
          onClick={submitCsv}
          disabled={!csv.trim()}
          className="mt-2 rounded bg-ink px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Import CSV
        </button>
      </section>
    </div>
  );
}
