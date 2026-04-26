'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useNgoStore } from '@/lib/ngo-store';
import { useCatalog } from '@/lib/catalog-client';
import { COUNTRIES } from '@/lib/config/countries';
import type { NgoCaseloadProfile } from '@/lib/ngo-store';
import type { SkillMapResult } from '@/lib/esco-mapper';
import { signVerification } from '@/lib/profile-schema';
import { buildNavigatorProfileV1 } from '@/lib/profile-v1-builder';
import { resilienceGaps } from '@/lib/resilience';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Download, Plus } from 'lucide-react';

const VALIDATION_METHODS = [
  { id: 'observation', label: 'Observation (demonstrated in person)' },
  { id: 'test', label: 'Test / practical assessment' },
  { id: 'peer_vouch', label: 'Peer vouch (community referee)' },
  { id: 'training_certificate', label: 'Training certificate on file' },
] as const;

export default function NgoCaseloadProfilePage() {
  const params = useParams<{ id: string }>();
  const profile = useNgoStore((s) => s.profiles.find((p) => p.id === params.id));
  const updateProfile = useNgoStore((s) => s.updateProfile);
  const addValidation = useNgoStore((s) => s.addValidation);
  const markExported = useNgoStore((s) => s.markExported);
  const navigatorName = useNgoStore((s) => s.navigatorName);
  const navigatorId = useNgoStore((s) => s.navigatorId);
  const catalog = useCatalog();

  const [mapping, setMapping] = useState<SkillMapResult | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [pathwayDraft, setPathwayDraft] = useState('');
  const [validationDraft, setValidationDraft] = useState<{
    skillUri: string;
    method: (typeof VALIDATION_METHODS)[number]['id'];
    note: string;
  }>({ skillUri: '', method: 'observation', note: '' });

  useEffect(() => {
    if (!profile || mapping || mappingLoading) return;
    if (!profile.workText && !profile.toolsText) return;
    setMappingLoading(true);
    fetch('/api/skills-map', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        education: profile.education,
        workText: profile.workText,
        toolsText: profile.toolsText,
        languages: profile.languages ?? [],
        aspirationsText: profile.aspirationsText,
      }),
    })
      .then((r) => r.json())
      .then((body) => setMapping(body))
      .finally(() => setMappingLoading(false));
  }, [profile, mapping, mappingLoading]);

  if (!profile) {
    return (
      <div>
        <BackButton href="/ngo" label="Back to your youth" className="mb-4" />
        <p>Profile not found.</p>
      </div>
    );
  }

  function downloadProfileJson(p: NgoCaseloadProfile) {
    if (!catalog) return;
    const payload = buildNavigatorProfileV1(
      p,
      mapping,
      { id: navigatorId, name: navigatorName },
      { catalogSkills: catalog.skills, catalogOccupations: catalog.occupations },
    );
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmapped-profile-${p.displayName.replace(/\W+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markExported(p.id);
  }

  async function submitValidation() {
    if (!validationDraft.skillUri) return;
    const label = catalog?.skills.find((s) => s.uri === validationDraft.skillUri)?.label;
    const validatedAt = new Date().toISOString();
    const signature = await signVerification({
      navigator_id: navigatorId,
      skill_code: validationDraft.skillUri,
      method: validationDraft.method,
      date: validatedAt,
      note: validationDraft.note || undefined,
    });
    addValidation(profile!.id, {
      skillUri: validationDraft.skillUri,
      skillLabel: label,
      method: validationDraft.method,
      note: validationDraft.note || undefined,
      validatedAt,
      validatorId: navigatorId,
      validatorName: navigatorName,
      signature,
    });
    setValidationDraft({ skillUri: '', method: 'observation', note: '' });
  }

  function submitPathway() {
    if (!pathwayDraft.trim()) return;
    updateProfile(profile!.id, {
      localPathways: [...profile!.localPathways, pathwayDraft.trim()],
    });
    setPathwayDraft('');
  }

  const mappedSkillUris = mapping?.esco_skills ?? [];
  const validatedUris = new Set(profile.validations.map((v) => v.skillUri));
  const unvalidatedMapped = mappedSkillUris.filter((u) => !validatedUris.has(u));
  const coaching = catalog ? resilienceGaps(mappedSkillUris, catalog.skills) : [];

  return (
    <div>
      <BackButton href="/ngo" label="Back to your youth" className="mb-4" />
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
          <p className="text-xs text-neutral-600">
            {COUNTRIES[profile.country].name} · status {profile.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => downloadProfileJson(profile)}
          >
            Export (JSON)
          </Button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <EditableField
          label="Work they've done"
          value={profile.workText ?? ''}
          rows={3}
          onSave={(v) => updateProfile(profile.id, { workText: v })}
        />
        <EditableField
          label="Tools / software"
          value={profile.toolsText ?? ''}
          rows={3}
          onSave={(v) => updateProfile(profile.id, { toolsText: v })}
        />
        <EditableField
          label="Aspirations"
          value={profile.aspirationsText ?? ''}
          rows={2}
          onSave={(v) => updateProfile(profile.id, { aspirationsText: v })}
        />
        <div>
          <span className="text-sm font-medium">Status</span>
          <select
            value={profile.status}
            onChange={(e) =>
              updateProfile(profile.id, { status: e.target.value as NgoCaseloadProfile['status'] })
            }
            className="mt-1 block w-full rounded border border-neutral-300 bg-white px-3 py-2"
          >
            <option value="intake">Intake</option>
            <option value="training">In training</option>
            <option value="placed">Placed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Mapped skills</h2>
        {mappingLoading && <p className="mt-2 text-sm text-neutral-600">Mapping…</p>}
        {!mappingLoading && mappedSkillUris.length === 0 && (
          <p className="mt-2 text-sm text-neutral-600">
            No skills mapped yet. Fill in work and tools text above.
          </p>
        )}
        {mappedSkillUris.length > 0 && catalog && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {mappedSkillUris.map((uri) => {
              const label = catalog.skills.find((s) => s.uri === uri)?.label ?? uri;
              const validated = validatedUris.has(uri);
              return (
                <li
                  key={uri}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    validated
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-neutral-300 bg-white text-neutral-800'
                  }`}
                >
                  {validated && <span aria-hidden>✓ </span>}
                  {label}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded border border-neutral-300 bg-white p-4">
        <h2 className="text-lg font-semibold">Record a validation</h2>
        <p className="text-sm text-neutral-700">
          Validations add credibility to the exported profile — an employer
          reading the JSON sees that a real navigator, named and dated, confirmed
          the skill.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-xs text-neutral-600">Skill</span>
            <select
              value={validationDraft.skillUri}
              onChange={(e) => setValidationDraft({ ...validationDraft, skillUri: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">— select —</option>
              {unvalidatedMapped.map((uri) => (
                <option key={uri} value={uri}>
                  {catalog?.skills.find((s) => s.uri === uri)?.label ?? uri}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">Method</span>
            <select
              value={validationDraft.method}
              onChange={(e) =>
                setValidationDraft({ ...validationDraft, method: e.target.value as typeof validationDraft.method })
              }
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
            >
              {VALIDATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">Note (optional)</span>
            <input
              value={validationDraft.note}
              onChange={(e) => setValidationDraft({ ...validationDraft, note: e.target.value })}
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
            />
          </label>
        </div>
        <Button
          onClick={submitValidation}
          disabled={!validationDraft.skillUri}
          size="sm"
          className="mt-3 disabled:opacity-50"
        >
          Record validation
        </Button>
      </section>

      {profile.validations.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
            Validations ({profile.validations.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {profile.validations.map((v, i) => (
              <li key={i} className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <div className="font-medium">{v.skillLabel ?? v.skillUri}</div>
                <div className="text-xs text-emerald-900">
                  {v.method} · validated by {v.validatorName} on{' '}
                  {new Date(v.validatedAt).toLocaleDateString()}
                </div>
                {v.note && <div className="mt-1 text-xs text-neutral-700">{v.note}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {coaching.length > 0 && (
        <section className="mt-8 rounded border border-indigo-200 bg-indigo-50 p-4">
          <h2 className="text-lg font-semibold text-indigo-950">
            Strategic coaching — resilience gaps
          </h2>
          <p className="mt-1 text-sm text-indigo-900">
            Suggest these adjacent skills in the next training cycle. Each
            recommendation is derived from a skill the youth already has —
            reachable, not aspirational.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {coaching.map((c) => (
              <li
                key={c.suggestion_uri}
                className="rounded border border-indigo-300 bg-white p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <strong>{c.suggestion_label}</strong>{' '}
                    <span className="text-xs text-neutral-500">({c.suggestion_uri})</span>
                  </div>
                  <span className="text-xs text-indigo-700">
                    built on: {c.from_label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-700">{c.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded border border-neutral-300 bg-white p-4">
        <h2 className="text-lg font-semibold">Local pathways</h2>
        <p className="text-sm text-neutral-700">
          Specific training programs or employer referrals available in this
          community — surfaced on the opportunity card pathway section.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={pathwayDraft}
            onChange={(e) => setPathwayDraft(e.target.value)}
            placeholder="e.g. GIZ Ghana — Electronics apprenticeship, starts March"
            className="flex-1 rounded border border-neutral-300 bg-white px-3 py-2"
          />
          <Button onClick={submitPathway} size="sm" icon={Plus}>
            Add
          </Button>
        </div>
        {profile.localPathways.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
            {profile.localPathways.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EditableField({
  label,
  value,
  rows,
  onSave,
}: {
  label: string;
  value: string;
  rows: number;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const dirty = draft !== value;
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => dirty && onSave(draft)}
        rows={rows}
        className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
      />
      {dirty && <p className="text-xs text-neutral-500">Unsaved — click away to save</p>}
    </div>
  );
}
