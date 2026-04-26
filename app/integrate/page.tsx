import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';

// /integrate — "Integration Reference (Prototype)". Spec §9.
// Public-facing page; server-rendered; no client state required.
export const metadata = {
  title: 'Integration Reference · UNMAPPED',
  description: 'API contract, country-config, and integration pattern for UNMAPPED.',
};

function Endpoint({
  method,
  path,
  description,
  request,
  response,
}: {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  request?: string;
  response: string;
}) {
  return (
    <div className="rounded border border-wb-line bg-white p-4">
      <div className="flex items-baseline gap-3">
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${
            method === 'GET' ? 'bg-sky-100 text-sky-900' : 'bg-indigo-100 text-indigo-900'
          }`}
        >
          {method}
        </span>
        <code className="text-sm font-semibold">{path}</code>
      </div>
      <p className="mt-2 text-sm text-wb-ink/80">{description}</p>
      {request && (
        <>
          <div className="mt-3 text-xs uppercase tracking-wide text-wb-ink/70">Request</div>
          <pre className="mt-1 overflow-x-auto rounded bg-wb-sand p-3 text-xs">{request}</pre>
        </>
      )}
      <div className="mt-3 text-xs uppercase tracking-wide text-wb-ink/70">Response</div>
      <pre className="mt-1 overflow-x-auto rounded bg-wb-sand p-3 text-xs">{response}</pre>
    </div>
  );
}

export default function IntegratePage() {
  const ghConfig = `{
  "code": "GH",
  "name": "Ghana",
  "locale": "tw-Latn",
  "currencyLabel": "GHS",
  "opportunityEmphasis": "self_employment_gig",
  "broadbandPenetration": 68,
  "routineTaskShare": 0.48,
  "educationLevels": [
    { "id": "bece", "label": "BECE (Junior High)" },
    { "id": "shs",  "label": "SHS / WASSCE" },
    { "id": "tertiary", "label": "Tertiary / University" }
  ],
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "tw", "label": "Twi" }
  ],
  "trainingProviders": ["NVTI", "GIZ Ghana", "Ashesi Career Centre"]
}`;
  const vnConfig = `{
  "code": "VN",
  "name": "Vietnam",
  "locale": "vi",
  "currencyLabel": "VND",
  "opportunityEmphasis": "formal_training",
  "broadbandPenetration": 82,
  "routineTaskShare": 0.44,
  "educationLevels": [
    { "id": "lower_secondary", "label": "THCS" },
    { "id": "upper_secondary", "label": "THPT" },
    { "id": "tertiary",        "label": "Đại học" }
  ],
  "languages": [
    { "code": "vi", "label": "Tiếng Việt" },
    { "code": "en", "label": "English" }
  ],
  "trainingProviders": ["[stub] vocational college"]
}`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <BackButton href="/" label="Back to role selector" className="mb-4" />
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
          For integration partners
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-wb-navy">
          Integration Reference <span className="text-wb-ink/60">(Prototype)</span>
        </h1>
        <p className="mt-3 text-base leading-relaxed text-wb-ink/80">
          UNMAPPED is a protocol, not an app. NGOs, training providers, employers,
          and ministries plug in via the endpoints below. Four config fields are
          all it takes to spin up a new country.
        </p>
      </header>

      <section className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Prototype scope.</strong> The hosted endpoints here are
        unauthenticated and rate-limited for demo purposes. A production
        deployment adds:
        <ul className="mt-2 list-disc pl-5">
          <li>OAuth 2.0 client credentials or JWT bearer tokens (API-key
            issuance preview at <Link href="/policymaker/ecosystem" className="underline">/policymaker/ecosystem</Link>)</li>
          <li>Per-tenant rate limiting with 429 back-off</li>
          <li>A stable <code>v1</code> contract governed by semantic versioning</li>
          <li>Signed share-links with server-side expiry (replaces the
            prototype's client-side base64 tokens)</li>
          <li>Audit logs for every verification signature and config change</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Portable profile schema</h2>
        <p className="mt-1 text-sm text-wb-ink/80">
          Every endpoint that produces a candidate identity emits a JSON-LD
          document with <code>schema: "unmapped.profile/v1"</code>. Employers
          read this document directly — no custom ATS adapter needed.
        </p>
        <pre className="mt-3 overflow-x-auto rounded border border-wb-line bg-white p-3 text-xs">{`{
  "@context": "https://unmapped.example/schema/profile/v1",
  "@type": "SkillIdentity",
  "schema": "unmapped.profile/v1",
  "core": { "id": "<uuid>", "timestamp": "<iso8601>", "standard": "ISCO-08" },
  "country": "GH",
  "subject": {
    "display_name": "Amara",
    "education": "shs",
    "languages": ["en", "tw"],
    "self_report": { "work_text": "…", "tools_text": "…" }
  },
  "signals": [{ "skill_code": "S1.1.4", "task_description": "smartphone hardware repair", "confidence": 0.88 }],
  "isco_occupations": ["7421", "2513"],
  "verifications": [{
    "navigator_id": "<uuid>",
    "navigator_name": "Kofi — GIZ Accra",
    "skill_code": "S1.1.4",
    "method": "observation",
    "date": "<iso8601>",
    "signature": "<sha256(id|skill|method|date|note)>"
  }],
  "risk_profile": [{ "isco_code": "7421", "base_exposure": 0.71, "calibrated_risk": 0.80, "skill_complexity_score": 0.22 }]
}`}</pre>
      </section>

      <section className="mt-10 space-y-5">
        <h2 className="text-xl font-semibold">API endpoints</h2>

        <Endpoint
          method="POST"
          path="/api/skills-map"
          description="Youth-side: map free-text self-report to ESCO + ISCO codes. Returns per-skill XAI evidence."
          request={`{
  "education": "shs",
  "workText": "I fix phones and built two small websites",
  "toolsText": "soldering iron, Android, JavaScript",
  "languages": ["en", "tw"]
}`}
          response={`{
  "status": "ok",
  "esco_skills": ["S1.1.4", "S1.1.2", "S1.2.1", ...],
  "isco_occupations": ["7421", "2513", ...],
  "confidence": 0.88,
  "explanations": [
    { "skill_uri": "S1.1.4", "evidence": "phones", "source_field": "work" }
  ]
}`}
        />

        <Endpoint
          method="POST"
          path="/api/map-job-description"
          description="Employer-side: map a free-text JD to ISCO + ESCO codes with character-span highlights."
          request={`{ "text": "Need a reliable person for phone screen repairs and stock management." }`}
          response={`{
  "input_text": "Need a reliable person for phone screen repairs and stock management.",
  "esco_skills": ["S1.1.4", "S2.1.6", ...],
  "isco_top_occupation": "7422",
  "confidence": 0.7,
  "highlights": [{ "start": 26, "end": 31, "skill_uri": "S1.1.4", "matched_text": "phone" }],
  "explanations": [{ "skill_uri": "S1.1.4", "evidence": "phone" }]
}`}
        />

        <Endpoint
          method="POST"
          path="/api/match"
          description="Ranked opportunities for a given profile + country. Every card carries source labels, calibrated risk, and a Wittgenstein implication."
          request={`{
  "country": "GH",
  "profileSkillUris": ["S1.1.4", "S1.1.2", "S1.2.1"]
}`}
          response={`{
  "country": "GH",
  "cards": [{
    "isco_code": "7421",
    "preferred_label": "Electronics mechanic",
    "match": { "matched": 3, "total": 6, "missing_labels": ["diagnostic testing", ...] },
    "signals": {
      "wage":    { "mean_monthly": 2840, "currency": "GHS", "year": 2024, "source": "ILO ILOSTAT ..." },
      "growth":  { "yoy_pct": 12, "latest_year": 2024, "source": "ILO ILOSTAT ..." },
      "premium": { "premium_pct": 58.2, "source": "ILO ILOSTAT computed ratio" }
    },
    "risk": { "breakdown": { "long_term_risk": 0.71, "near_term_displacement_risk": 0.80, ... } },
    "wittgenstein": { "implication": { "sentence": "..." } }
  }]
}`}
        />

        <Endpoint
          method="GET"
          path="/api/policymaker/aggregate?country=GH"
          description="Aggregate payload for the Command Center. Sector employment, wages, Wittgenstein, WBES, KPIs (Skill Divergence Index, Automation Hotspots, ROI on Training)."
          response={`{
  "country_name": "Ghana",
  "sectors": [...],
  "occupation_risks": [...],
  "wdi": {...}, "wbes": {...},
  "kpis": {
    "skill_divergence": { "index": 0.06, "current": {...}, "target": {...} },
    "automation_hotspots": [{ "sector": "...", "routine_density": 0.77 }],
    "roi_on_training":     [{ "sector": "...", "roi_per_skill_point": 178 }]
  }
}`}
        />

        <Endpoint
          method="POST"
          path="/api/policymaker/validate-config"
          description="Validate a CountryConfig JSON before it's loaded into the platform. Returns a structured error + warning report."
          request={`{
  "code": "VN", "name": "Vietnam", "locale": "vi",
  "currencyLabel": "VND", "opportunityEmphasis": "formal_training",
  "broadbandPenetration": 82, "routineTaskShare": 0.44,
  "educationLevels": [...], "languages": [...], "trainingProviders": [...]
}`}
          response={`{
  "ok": true,
  "issues": []
}`}
        />

        <Endpoint
          method="GET"
          path="/api/skills-catalog"
          description="Read-only list of ESCO skills + occupations in the demo subset. Consumed by client-side components that need human-readable labels for codes."
          response={`{
  "skills": [{ "uri": "S1.1.4", "label": "smartphone hardware repair" }, ...],
  "occupations": [{ "isco_code": "7421", "preferred_label": "Electronics mechanic", ... }]
}`}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Drop-in integration example</h2>
        <p className="mt-1 text-sm text-wb-ink/80">
          An NGO forwards an intake form from their existing CRM. Three lines
          of code.
        </p>
        <pre className="mt-3 overflow-x-auto rounded border border-wb-line bg-white p-3 text-xs">{`// An NGO intake adapter (TypeScript, 12 lines)
const res = await fetch("https://unmapped.example/api/skills-map", {
  method: "POST",
  headers: { "content-type": "application/json", "x-tenant": "GIZ_GH" },
  body: JSON.stringify({
    education: intake.highest_education,
    workText:  intake.work_history_free_text,
    toolsText: intake.tools_owned_free_text,
    languages: intake.languages,
  }),
});
const profile = await res.json();  // unmapped.profile/v1 skeleton + explanations
// Persist profile.core.id against your internal caseload record and hand
// the JSON to the Navigator portal for in-person verification.`}</pre>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Country config diff</h2>
        <p className="mt-1 text-sm text-wb-ink/80">
          Every country on UNMAPPED is a JSON config file. Four fields change
          between Ghana and Vietnam — no code edits.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-wb-ink/70">countries/GH.json</div>
            <pre className="mt-1 overflow-x-auto rounded border border-wb-line bg-white p-3 text-xs">{ghConfig}</pre>
          </div>
          <div>
            <div className="text-xs uppercase text-wb-ink/70">countries/VN.json</div>
            <pre className="mt-1 overflow-x-auto rounded border border-wb-line bg-white p-3 text-xs">{vnConfig}</pre>
          </div>
        </div>
        <p className="mt-3 text-xs text-wb-ink/70">
          Tour:{' '}
          <Link href="/policymaker/config" className="underline">
            /policymaker/config
          </Link>{' '}
          ships a live validator and a blank-template generator. Validation is
          real; persistence is the prototype's only cut corner.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Tenants already connected (demo data)</h2>
        <p className="mt-1 text-sm text-wb-ink/80">
          The <Link href="/policymaker/ecosystem" className="underline">ecosystem page</Link>{' '}
          shows API keys issued to pilot tenants. In a real deployment each
          tenant is scoped to a subset of the endpoints above.
        </p>
      </section>

      <footer className="mt-10 border-t border-wb-line pt-4 text-xs text-wb-ink/60">
        See <Link href="/about/limits" className="underline">/about/limits</Link>{' '}
        for what UNMAPPED deliberately does not do.
      </footer>
    </main>
  );
}
