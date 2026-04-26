# UNMAPPED

Open, localizable infrastructure layer that closes the distance between a young person's real skills (often informal, uncredentialed) and real economic opportunity in low- and middle-income countries. Prototype for the World Bank Youth Summit Hackathon.

## What's shipped

End-to-end bi-directional protocol across four user groups on one codebase. Every visitor lands on a **role-selector at `/`** and walks into a **role-locked shell** — no cross-role nav, no leaked jargon. One `⟳ Switch role` affordance (top-right of every shell) is the only bridge.

### Role-gated architecture

- **`/`** — role selector landing. Four equally-weighted tiles for a first-time visitor; a "Continue as [role]" shortcut for returning visitors (driven by `lib/role-store.ts`). Links to `/integrate` and `/about/limits` in a quiet footer.
- **Youth shell** (`/entry`, `/profile`, `/opportunities`, `/share/[token]`) — the 5-question skill capture, a plain-language Digital Skill Passport, opportunity cards with three econometric signals + risk lens + Wittgenstein 2035 subcard. ISCO / ESCO codes and the risk formula are always behind disclosures.
- **Employer shell** as a **linear wizard** — `/employer` (Step 1: "Who are you hiring for?" with two tiles, free-text RECOMMENDED), `/employer/jd` (Step 2: Transparency Breadcrumb with three stages), `/employer/candidates` (Step 3: plain-language talent cards), `/employer/[id]` (talent detail), `/employer/search` (alternate granular filter).
- **NGO shell** (`/ngo`, `/ngo/bulk`, `/ngo/[id]`, `/ngo/impact`) — caseload, bulk CSV + grid intake, signed verifications with SHA-256 audit trail, resilience-gap coaching, transition monitoring. The practitioner doing the vouching is called a "navigator"; the group they work for is "NGOs & Training Providers".
- **Policymaker shell** (`/policymaker`, `/policymaker/skill-gaps`, `/sectors`, `/invest`, `/divergence`, `/config`, `/ecosystem`) — "National Human Capital Command Center" with three KPIs (Skill Divergence Index, Automation Hotspots, ROI on Training), adjustable-weight investment prioritization with CSV export, supply-vs-demand divergence heatmap, white-label config validator, API key / tenant ecosystem.

Plus **`/integrate`** (API contract + production-vs-prototype disclosure) and **`/about/limits`** (honest limits).

## Architecture

```
/app
  /page.tsx                ← role-selector landing (/)
  /(youth)/
    entry/                 ← 5-question capture (moved from /)
    profile/               ← Digital Skill Passport (QR share, JSON-LD export)
    opportunities/         ← cards with 3 signals + risk lens + Wittgenstein
  /ngo/                    ← NGO caseload portal (renamed from /navigator)
    page.tsx, bulk/, impact/, [id]/
  /employer/               ← linear wizard
    page.tsx (Step 1), jd/ (Step 2), candidates/ (Step 3),
    [id]/ (talent detail), search/ (alt filter)
  /policymaker/            ← Command Center + 6 sub-pages
  /share/[token]/          ← read-only profile for employer share links
  /integrate/              ← Integration Reference (Prototype)
  /about/limits/           ← Honest limits
  /api
    /skills-map            ← free-text → ESCO (mock; Claude swap ready)
    /map-job-description   ← JD → ISCO + ESCO with highlight spans
    /match                 ← profile → ranked opportunity cards
    /skills-catalog        ← read-only ESCO/ISCO catalog
    /policymaker/aggregate ← Command Center payload
    /policymaker/validate-config ← schema report for uploaded configs

/components
  RoleSwitcher.tsx         ← icon-only cross-role bridge (top-right)
  YouthHeader.tsx, EmployerHeader.tsx, NgoHeader.tsx, PolicymakerHeader.tsx
  OpportunityCardView.tsx, ProfilePassportView.tsx, RiskLens.tsx,
  QRCodeView.tsx, BandwidthBadge.tsx, CountrySwitcher.tsx
  /ui/
    BackButton.tsx         ← consistent back affordance (link or router.back())
    Disclosure.tsx         ← zero-JS <details> wrapper (two variants)
    PlainExplanation.tsx   ← tappable "?" tooltip for jargon
    WorkflowStepper.tsx    ← numbered horizontal stepper
    OpportunityTypeBadge.tsx
    Card.tsx, Button.tsx, Badge.tsx, Stat.tsx, SourceLabel.tsx, Sparkline.tsx

/lib
  role-store.ts            ← Zustand; activeRole drives role-gated landing
  workflow-steps.ts        ← per-role stepper definitions + path matcher
  config/countries.ts      ← GH, BD active; VN, KE, BR stubs
  data-loaders/            ← 9 typed loaders per source
  risk-calibration.ts      ← near-term + V3.0 final-risk formulas
  returns-to-education.ts, skill-match.ts, sector-map.ts
  esco-mapper.ts           ← keyword mock + Claude prompt; emits XAI explanations
  jd-mapper.ts             ← JD → ISCO/ESCO + highlight spans
  wittgenstein-implications.ts, human-capital-kpis.ts
  risk-narrative.ts        ← plain-language risk sentence for Youth cards
  profile-schema.ts        ← unmapped.profile/v1 JSON-LD + sign/validate
  profile-v1-builder.ts    ← youth + ngo-mediated → v1 profile
  share-token.ts, verify-signatures.ts, resilience.ts
  profile-store.ts (youth), ngo-store.ts, employer-store.ts,
  ecosystem-store.ts, market-signal-store.ts

/messages                  ← next-intl catalogs: en + tw-Latn
/public/data/              ← committed JSON outputs from the Python pipeline
/scripts/data-prep/        ← Python fetchers + orchestrator + crosswalk CSV
```

## Progressive disclosure by role (what's hidden by default)

| Group | Always visible | Behind disclosure |
|---|---|---|
| **Youth** | skill names, verified ✓, plain-language risk sentence, econometric numbers with plain labels, opportunity-type badge | ISCO / ESCO codes, risk formula inputs, raw JSON export |
| **Employer** | role name, candidate name + country, "X of Y skills match" progress bar, verified-vs-self chips, action verbs | ISCO code behind each role, match-weight math, signature hex, ranking algorithm |
| **NGOs & Training Providers** | names, skill counts, validation state, placements | SHA-256 signatures, risk formula inputs |
| **Policymaker** | everything — dense tables, visible formulas, KPI sparklines, CSV exports | (nothing hidden — this group wants the numbers) |

## User-flow coverage

| V3.0 rule | Where it lives |
|---|---|
| R1 Explainable AI on Youth + Employer | `lib/esco-mapper.ts#explanations`, `lib/jd-mapper.ts#highlights` + Transparency Breadcrumb at `/employer/jd` |
| R2 Contextual calibration — Final_Risk = (global × connectivity) + (1 − skill_durability) | `lib/risk-calibration.ts#calibrateRisk` (both near-term + V3.0 final risk surfaced per card) |
| R3 No hardcoding — all taxonomic labels + matching logic from AppConfig | `lib/config/countries.ts`, `/policymaker/config` validator, `lib/data-loaders/*` source-labeled envelopes |
| Opportunity types surfaced | `components/ui/OpportunityTypeBadge.tsx` derives formal / self-employment / gig / training from country emphasis + ISCO major group |

## Back-navigation

Every detail route carries a visible back button (`components/ui/BackButton.tsx`). Youth: profile → entry, opportunities → profile. Employer wizard: each step → previous step. NGO: detail / bulk / impact → caseload. Policymaker: every sub-page → overview. Top-right `⟳ Switch role` is present on every shell.

## Local development

Next.js 14 requires Node.js **≥ 18.17**. If your system Node is older (e.g. 18.16), bump with `nvm install 20 && nvm use 20` before `npm install`.

```bash
npm install
npm run dev               # Next on http://localhost:3000
npm run data-prep         # regenerate public/data/*.json from Python seeds
npm run smoke             # loader + pure-fn smoke
npm run smoke:api         # end-to-end API routes
npm run smoke:profile     # profile v1 + signatures + share token round-trip
```

## Data sources — 9 live, more in the roadmap

| Source | File | Driven by |
|---|---|---|
| ESCO occupations + essential skills | `esco_occupations.json`, `esco_skills.json` | Skill match + profile signals |
| O*NET task descriptions | `onet_tasks.json` | Pathway narrative |
| ISCO-08 reference | `isco08.json` | Join key across the stack |
| ILO ILOSTAT employment | `ilostat_employment.json` | Signal 2: YoY growth |
| ILO ILOSTAT earnings | `ilostat_earnings.json` | Signal 1: wage floor; signal 3: tertiary premium |
| World Bank WDI | `wdi.json` | Command Center context stats |
| World Bank Enterprise Surveys | `wbes.json` | Skill-shortage constraint; investment weights |
| Wittgenstein Centre projections | `wittgenstein.json` | "Where you are heading by 2035"; Skill Divergence Index |
| Frey & Osborne automation scores | `frey_osborne.json` | Long-term risk + formula B base |
| **ILO Future of Work task indices** | `ilo_fow_tasks.json` | Per-occupation routine share → near-term + final risk |
| ITU mobile broadband (per-country constant) | `lib/config/countries.ts` | `infrastructure_delay_factor` |

Integration roadmap (documented, not wired): WB Human Capital Index, WB GLD, WB STEP, UN Population Projections, UNESCO UIS, Global Findex.

## Portability — `unmapped.profile/v1`

Youth self-serve and NGO-mediated paths emit the same JSON-LD:

```
{
  "@context": "https://unmapped.example/schema/profile/v1",
  "@type":    "SkillIdentity",
  "schema":   "unmapped.profile/v1",
  "core":     { "id": uuid, "timestamp": iso8601, "standard": "ISCO-08" },
  "country":  "GH",
  "subject":  { ... },
  "signals":  [{ "skill_code", "task_description", "confidence" }, ...],
  "isco_occupations": ["7421", "2513", ...],
  "verifications": [{ "navigator_id", "skill_code", "method", "date", "signature" }],
  "risk_profile":  [{ "isco_code", "base_exposure", "calibrated_risk", "skill_complexity_score" }]
}
```

Every verification signature is SHA-256 over `(navigator_id|skill|method|date|note)` — the employer decoder recomputes them on drop and flags tampering.

The schema field names keep `navigator_id` / `navigator_name` even though the route group is now `/ngo`. The name refers to the **practitioner job title** (the person doing the vouching inside an NGO or training program), not the organization. Changing these fields would break profiles already issued in the wild.

## Limits

Full page at [/about/limits](app/about/limits/page.tsx). Short version:

- Two countries demo-grade (GH, BD); three stubs (VN, KE, BR)
- LMIC risk calibration is a defensible heuristic, not a validated econometric model
- Returns to education is a wage ratio within sector, not a controlled regression
- Seed data realistic-order-of-magnitude; every envelope carries a `source` flag
- O*NET SOC↔ISCO-08 crosswalk loses ~15% on full fetch; prototype subset joins at 100%
- Skill match is count-based ESCO `essentialSkills` overlap, not a semantic similarity model
- No live job vacancies — aggregate sector data only
- Share tokens are base64url in the prototype; production signs them server-side
