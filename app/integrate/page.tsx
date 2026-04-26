import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { BrandMark } from '@/components/ui/BrandMark';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Integration Reference · UNMAPPED',
  description: 'API contract, country-config, and integration pattern for UNMAPPED.',
};

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
        method === 'GET' ? 'bg-sky-100 text-sky-900' : 'bg-indigo-100 text-indigo-900'
      }`}
    >
      {method}
    </span>
  );
}

function Endpoint({
  method,
  path,
  description,
  whoUsesIt,
  request,
  response,
}: {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  whoUsesIt: string;
  request?: string;
  response: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-baseline gap-3">
        <MethodBadge method={method} />
        <code className="text-sm font-semibold text-wb-navy">{path}</code>
      </div>
      <p className="mt-2 text-sm text-wb-ink/80">{description}</p>
      <p className="mt-1 text-xs text-wb-ink/50">
        <span className="font-semibold uppercase tracking-wide">Used by: </span>
        {whoUsesIt}
      </p>
      {request && (
        <>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-wb-ink/50">
            Request body
          </div>
          <pre className="mt-1 overflow-x-auto rounded bg-wb-sand p-3 text-xs">{request}</pre>
        </>
      )}
      <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-wb-ink/50">
        Response
      </div>
      <pre className="mt-1 overflow-x-auto rounded bg-wb-sand p-3 text-xs">{response}</pre>
    </Card>
  );
}

function AudienceCard({
  emoji,
  who,
  example,
  useCase,
  endpoints,
}: {
  emoji: string;
  who: string;
  example: string;
  useCase: string;
  endpoints: string[];
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>{emoji}</span>
        <div>
          <p className="font-semibold text-wb-navy">{who}</p>
          <p className="text-xs text-wb-ink/60">{example}</p>
        </div>
      </div>
      <p className="text-sm text-wb-ink/80">{useCase}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {endpoints.map((ep) => (
          <code key={ep} className="rounded bg-wb-sand px-1.5 py-0.5 text-xs text-wb-navy">
            {ep}
          </code>
        ))}
      </div>
    </Card>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wb-navy text-sm font-bold text-white">
        {number}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-wb-navy">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-wb-ink/80">{children}</div>
      </div>
    </div>
  );
}

export default function IntegratePage() {
  const ghConfig = `{
  "code": "GH",
  "name": "Ghana",
  "locale": "en",
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
  const bdConfig = `{
  "code": "BD",
  "name": "Bangladesh",
  "locale": "en",
  "currencyLabel": "BDT",
  "opportunityEmphasis": "formal_training",
  "broadbandPenetration": 40,
  "routineTaskShare": 0.52,
  "educationLevels": [
    { "id": "ssc",     "label": "SSC (Secondary)" },
    { "id": "hsc",     "label": "HSC (Higher Secondary)" },
    { "id": "bachelor","label": "Bachelor / University" }
  ],
  "languages": [
    { "code": "bn", "label": "Bengali" },
    { "code": "en", "label": "English" }
  ],
  "trainingProviders": ["BTEB", "a2i Skills", "BRAC Skills Development"]
}`;

  return (
    <div className="min-h-screen bg-wb-sand">
      <header className="border-b border-wb-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BrandMark subtitle="Integration Reference" />
          <BackButton href="/" label="Back to home" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Hero */}
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wb-ink/50">
            For integration partners
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-wb-navy">
            Integration Reference{' '}
            <span className="text-wb-ink/40">(Prototype)</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-wb-ink/80">
            UNMAPPED is infrastructure, not an app. It sits in the background and connects
            the systems that organizations already use — CRMs, job boards, HR platforms,
            ministry dashboards — by giving every informal worker a portable, machine-readable
            skill identity. You plug in once; every other organization that has also integrated
            can immediately read and verify the same profile.
          </p>
        </section>

        {/* Who is this for */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">Who integrates and why</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            Four types of organizations connect to UNMAPPED. Each interacts with a different
            subset of the API.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AudienceCard
              emoji="🤝"
              who="NGO / Field organisation"
              example="e.g. GIZ, BRAC, IRC field offices"
              useCase="You run intake programs and already collect work history in a spreadsheet or CRM. Instead of manually writing a CV for each young person, you forward their intake data to UNMAPPED and get back a structured skill profile. Your navigator then verifies skills in person and signs them — making the profile trusted by any employer in the network."
              endpoints={['/api/skills-map', '/api/skills-catalog']}
            />
            <AudienceCard
              emoji="🏢"
              who="Employer / Recruiter"
              example="e.g. local manufacturer, call centre, SME"
              useCase="You paste a job description and get back the exact ISCO/ESCO skill codes it requires. Candidates who have been through UNMAPPED arrive with a profile in the same vocabulary — so instead of screening resumes manually, you compare codes. You can also receive a candidate's share-link and verify their navigator signatures before the first interview."
              endpoints={['/api/map-job-description', '/api/match', '/api/skills-catalog']}
            />
            <AudienceCard
              emoji="🏛️"
              who="Government ministry / Labour authority"
              example="e.g. Ministry of Employment, TVET authority"
              useCase="You need aggregate data to set training budgets and spot automation risk across sectors. The policymaker endpoint gives you a real-time dashboard payload — sector employment, wage trends, skill divergence index, and ROI on training — all sourced from ILO and World Bank data. You can also register your country as a config file, which activates the full platform for your citizens immediately."
              endpoints={['/api/policymaker/aggregate', '/api/policymaker/validate-config']}
            />
            <AudienceCard
              emoji="🎓"
              who="Training provider / TVET institution"
              example="e.g. NVTI Ghana, BTEB Bangladesh, private bootcamp"
              useCase="You offer courses. UNMAPPED tells you which skills your candidates are already missing before they enrol — so you can skip what they know and focus on the gaps. After graduation, you can add a verification signature to their profile marking the new skill as completed, making them immediately more visible to employers in the network."
              endpoints={['/api/skills-map', '/api/match', '/api/skills-catalog']}
            />
          </div>
        </section>

        {/* How to connect */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">How to set up an integration</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            A typical integration takes one afternoon. The steps are the same regardless of
            which organization type you are — only the endpoints you call differ.
          </p>
          <div className="mt-6 space-y-7">
            <Step number={1} title="Request an API key">
              <p>
                Go to the{' '}
                <Link href="/policymaker/ecosystem" className="text-wb-blue underline hover:text-wb-navy">
                  ecosystem page
                </Link>{' '}
                and generate a demo key for your organization. In this prototype the key is a
                localStorage token scoped to your tenant ID. In production, this is an OAuth 2.0
                client credential issued by the UNMAPPED IAM system — your key limits which
                endpoints you can call and which country&apos;s data you can read.
              </p>
            </Step>

            <Step number={2} title="(Ministries only) Submit your country config">
              <p>
                If you are registering a new country, create a JSON file with the fields shown
                in the Country config section below. Validate it first using{' '}
                <code className="rounded bg-wb-sand px-1 text-xs">/api/policymaker/validate-config</code>.
                Once submitted, your country code activates the full platform — the youth flow,
                employer matching, and policymaker dashboard — all localized to your education
                levels, currency, and language. No code deployment required.
              </p>
            </Step>

            <Step number={3} title="Forward your intake data">
              <p>
                From your CRM, HR system, or intake form, send the young person&apos;s free-text
                work history and tool list to{' '}
                <code className="rounded bg-wb-sand px-1 text-xs">/api/skills-map</code>. The
                response contains structured ESCO skill codes and the specific words or phrases
                that triggered each code — so you can show the person exactly what was recognized.
                Store the returned <code className="rounded bg-wb-sand px-1 text-xs">core.id</code>{' '}
                against your internal record. This UUID is the permanent link between your
                caseload and the UNMAPPED profile.
              </p>
            </Step>

            <Step number={4} title="Navigator signs the skills (NGOs / training providers)">
              <p>
                Open the NGO portal, search by the candidate&apos;s name or ID, and have a field
                navigator observe the candidate performing the skill. Click Sign — the portal
                writes a SHA-256 signature over the skill code, method, date, and navigator ID.
                Signed skills carry significantly more weight with employers than self-reported
                ones. Any employer who receives the profile can verify the signature independently
                without calling UNMAPPED.
              </p>
            </Step>

            <Step number={5} title="Share or query the profile">
              <p>
                The candidate can share their profile as a URL. Employers open the link, see the
                skill list and ISCO codes, verify navigator signatures, and compare against their
                own job description (via{' '}
                <code className="rounded bg-wb-sand px-1 text-xs">/api/map-job-description</code>
                ). No login required on the employer side for verification — the signature is
                self-contained in the profile JSON.
              </p>
            </Step>

            <Step number={6} title="Pull aggregate data (ministries / researchers)">
              <p>
                Call{' '}
                <code className="rounded bg-wb-sand px-1 text-xs">/api/policymaker/aggregate?country=GH</code>{' '}
                to get a fully hydrated dashboard payload — sector employment from ILO ILOSTAT,
                automation risk scores from Frey-Osborne calibrated to local conditions, wage
                premiums by education level, and three derived KPIs. Pipe this into your own
                BI tool or use the built-in{' '}
                <Link href="/policymaker" className="text-wb-blue underline hover:text-wb-navy">
                  policymaker dashboard
                </Link>{' '}
                directly.
              </p>
            </Step>
          </div>
        </section>

        {/* Prototype scope notice */}
        <Card className="mt-12 border-amber-300 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">Prototype limitations</p>
          <p className="mt-1 text-sm text-amber-800">
            Everything above works today in the prototype. A production deployment replaces:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            <li>
              Demo API keys → OAuth 2.0 client credentials with per-tenant rate limiting and 429 back-off
            </li>
            <li>
              Base64 share-link tokens → server-signed, short-lived URLs with audit logs
            </li>
            <li>
              SHA-256 navigator signatures → full PKI (navigator signing key, rotation, public verifier)
            </li>
            <li>
              Config validation without persistence → authenticated config storage and versioning
            </li>
            <li>
              Demo country data → live ILOSTAT + World Bank fetchers with freshness indicators
            </li>
          </ul>
        </Card>

        {/* Profile schema */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">The portable profile — what you actually receive</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            Every API call that involves a candidate produces a JSON-LD document in the{' '}
            <code className="rounded bg-wb-sand px-1 text-xs">unmapped.profile/v1</code> schema.
            This is the universal format all four organization types can read without a custom adapter.
            It contains the raw self-report, the derived skill codes, any navigator signatures,
            the suggested ISCO occupations, and the automation risk score for each occupation.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-wb-line bg-white p-4 text-xs shadow-sm">{`{
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
  // Skills recognized from the self-report
  "signals": [{ "skill_code": "S1.1.4", "task_description": "smartphone hardware repair", "confidence": 0.88 }],
  // ISCO occupations this profile maps to
  "isco_occupations": ["7421", "2513"],
  // Navigator signatures — one per verified skill
  "verifications": [{
    "navigator_id": "<uuid>",
    "navigator_name": "Kofi — GIZ Accra",
    "skill_code": "S1.1.4",
    "method": "observation",
    "date": "<iso8601>",
    "signature": "<sha256(id|skill|method|date|note)>"
  }],
  // Automation risk per occupation, calibrated to local infrastructure
  "risk_profile": [{ "isco_code": "7421", "base_exposure": 0.71, "calibrated_risk": 0.80, "skill_complexity_score": 0.22 }]
}`}</pre>
        </section>

        {/* API endpoints */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">API endpoints</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            All six endpoints are live in this prototype and tested against real data payloads.
          </p>
          <div className="mt-5 space-y-4">
            <Endpoint
              method="POST"
              path="/api/skills-map"
              whoUsesIt="NGOs processing intake forms, training providers screening enrollees"
              description="Converts a young person's free-text work history and tool list into structured ESCO skill codes and ISCO occupation codes. Returns the specific word or phrase that triggered each code (XAI evidence), so you can show the candidate what was recognized. If confidence is too low, returns a flagged_low_confidence status — the UI prompts a re-entry rather than silently producing bad codes."
              request={`{
  "education": "shs",
  "workText": "I fix phones and built two small websites",
  "toolsText": "soldering iron, Android, JavaScript",
  "languages": ["en", "tw"]
}`}
              response={`{
  "status": "ok",                          // or "flagged_low_confidence"
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
              whoUsesIt="Employers parsing job postings before posting or screening candidates"
              description="Takes any free-text job description and returns the ISCO occupation and ESCO skills it requires, with character-span highlights showing exactly which words triggered each code. Employers use this to discover what ISCO vocabulary their role falls under — which then lets them compare against UNMAPPED candidate profiles using a shared taxonomy rather than keyword matching."
              request={`{ "text": "Need a reliable person for phone screen repairs and stock management." }`}
              response={`{
  "input_text": "Need a reliable person for phone screen repairs...",
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
              whoUsesIt="Any portal showing opportunity cards to a candidate or a navigator"
              description="Takes a profile's skill URIs and a country code, and returns ranked job opportunities fully hydrated with ILO wage data, year-on-year growth, education wage premium, calibrated automation risk, and a 2035 labour market outlook. Every number carries a source label. This is the endpoint that powers the youth Opportunities page — but you can call it from any interface."
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
    "risk": { "breakdown": { "long_term_risk": 0.71, "near_term_displacement_risk": 0.80 } },
    "wittgenstein": { "implication": { "sentence": "..." } }
  }]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/policymaker/aggregate?country=GH"
              whoUsesIt="Ministry dashboards, World Bank country teams, labour researchers"
              description="Returns a fully hydrated national dashboard payload: sector employment and wages from ILO ILOSTAT, World Bank WDI indicators (GDP/capita, NEET rate), WBES skills constraints, Wittgenstein education projections, and three derived KPIs — Skill Divergence Index, Automation Hotspots by sector, and ROI on Training per skill point. All numbers carry source strings."
              response={`{
  "country_name": "Ghana",
  "sectors": [...],            // employment + wage by sector
  "occupation_risks": [...],   // automation risk per ISCO occupation
  "wdi": {...},                // GDP, NEET, labour force participation
  "wbes": {...},               // skills constraints, unfilled vacancies
  "kpis": {
    "skill_divergence":   { "index": 0.06, "current": {...}, "target": {...} },
    "automation_hotspots":[{ "sector": "...", "routine_density": 0.77 }],
    "roi_on_training":    [{ "sector": "...", "roi_per_skill_point": 178 }]
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/api/policymaker/validate-config"
              whoUsesIt="Ministry IT teams or NGO country directors adding a new country"
              description="Validates a CountryConfig JSON against the full schema before it is loaded into the platform. Returns a structured list of errors and warnings with field paths — so you can fix issues before submitting. The live validator and blank-template generator in the policymaker Config tab call this endpoint on every keystroke."
              request={`{
  "code": "BD", "name": "Bangladesh", "locale": "en",
  "currencyLabel": "BDT", "opportunityEmphasis": "formal_training",
  "broadbandPenetration": 40, "routineTaskShare": 0.52,
  "educationLevels": [...], "languages": [...], "trainingProviders": [...]
}`}
              response={`{
  "ok": true,
  "issues": []    // or [{ "severity": "error", "path": "broadbandPenetration", "message": "must be 0–100" }]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/skills-catalog"
              whoUsesIt="Any front-end component that needs to display human-readable labels for ESCO codes"
              description="Returns the full ESCO skills and ISCO occupations subset used by this prototype. Use this to build dropdowns, autocomplete inputs, or code-to-label lookups without embedding the taxonomy in your own codebase. The catalog is static for this prototype; production would expose a paginated, searchable endpoint."
              response={`{
  "skills":      [{ "uri": "S1.1.4", "label": "smartphone hardware repair" }, ...],
  "occupations": [{ "isco_code": "7421", "preferred_label": "Electronics mechanic" }, ...]
}`}
            />
          </div>
        </section>

        {/* Code example */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">Complete NGO intake example</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            A field office at GIZ Accra has an existing intake form in their CRM. A caseworker
            fills it in during a community session. This adapter runs on form submit — no manual
            data entry into UNMAPPED, no separate login required for the caseworker.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-wb-line bg-white p-4 text-xs shadow-sm">{`// Step 1: Send the intake form data to UNMAPPED
const res = await fetch("https://unmapped.example/api/skills-map", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-tenant": "GIZ_GH",        // your API key / tenant ID
  },
  body: JSON.stringify({
    education: intake.highest_education,    // e.g. "shs"
    workText:  intake.work_history,         // free text from the form
    toolsText: intake.tools_owned,          // free text from the form
    languages: intake.languages,            // e.g. ["en", "tw"]
  }),
});

const profile = await res.json();
// profile.status is "ok" or "flagged_low_confidence"
// profile.esco_skills is the list of recognized skill codes
// profile.core.id is the UUID to store in your CRM

// Step 2: Store the UNMAPPED ID in your CRM record
await crm.updateCase(intake.caseId, {
  unmapped_profile_id: profile.core.id,
  skills_recognized:   profile.esco_skills,
});

// Step 3: Open the NGO portal so a navigator can verify skills in person.
// The portal loads the profile by core.id — no further API call needed.
// After observation, the navigator signs each skill directly in the portal UI.`}</pre>
          <p className="mt-3 text-xs text-wb-ink/60">
            The domain <code>unmapped.example</code> is a placeholder — point this at your
            local dev server (<code>http://localhost:3000</code>) to test it today.
          </p>
        </section>

        {/* Country config */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">Adding a new country</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            Every country is a single JSON config file. The platform reads it and activates
            the correct education levels, currency labels, language options, and training
            provider names throughout the entire UI — no code changes. Ghana and Bangladesh
            are shown here as examples of two very different configurations.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-wb-ink/50">
                countries/GH.json — Ghana (self-employment emphasis)
              </div>
              <pre className="overflow-x-auto text-xs">{ghConfig}</pre>
            </Card>
            <Card>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-wb-ink/50">
                countries/BD.json — Bangladesh (formal training emphasis)
              </div>
              <pre className="overflow-x-auto text-xs">{bdConfig}</pre>
            </Card>
          </div>
          <p className="mt-3 text-xs text-wb-ink/60">
            Validate your config before submitting at{' '}
            <Link href="/policymaker/config" className="text-wb-blue underline hover:text-wb-navy">
              /policymaker/config
            </Link>{' '}
            — the live validator highlights errors field by field. Persistence is the only
            prototype cut corner; the validation itself is real.
          </p>
        </section>

        {/* Tenants */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-wb-navy">Tenants already connected (demo)</h2>
          <p className="mt-2 text-sm text-wb-ink/80">
            The{' '}
            <Link href="/policymaker/ecosystem" className="text-wb-blue underline hover:text-wb-navy">
              ecosystem page
            </Link>{' '}
            shows the API keys issued to pilot tenants in the demo — GIZ Ghana, a2i Bangladesh,
            the Accra Skills Exchange, and two employer accounts. In production, each tenant is
            scoped to a specific country and a specific subset of the endpoints above, with
            per-tenant audit logs.
          </p>
        </section>

        <footer className="mt-12 border-t border-wb-line pt-5 text-xs text-wb-ink/60">
          See{' '}
          <Link href="/about/limits" className="text-wb-blue underline hover:text-wb-navy">
            /about/limits
          </Link>{' '}
          for what UNMAPPED deliberately does not do, and where the data has known gaps.
        </footer>
      </main>
    </div>
  );
}
