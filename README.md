# UNMAPPED

Open, localizable infrastructure layer that closes the distance between a young person's real skills (often informal, uncredentialed) and real economic opportunity in low- and middle-income countries. Prototype for the World Bank Youth Summit Hackathon.

## What's shipped

End-to-end bi-directional protocol across all four user groups:

- **Youth** — [/](app/(youth)/page.tsx) entry flow, [/profile](app/(youth)/profile/page.tsx) "Digital Skill Passport" with QR-scannable share link + JSON-LD export, [/opportunities](app/(youth)/opportunities/page.tsx) cards with 3 econometric signals + side-by-side long-term/near-term risk + Wittgenstein 2035 subcard
- **Navigator** — [/navigator](app/navigator/page.tsx) caseload, [/navigator/bulk](app/navigator/bulk/page.tsx) grid + CSV intake, [/navigator/[id]](app/navigator/%5Bid%5D/page.tsx) per-profile with signed verifications + resilience-gap coaching suggestions, [/navigator/impact](app/navigator/impact/page.tsx) transition monitoring
- **Employer** — [/employer](app/employer/page.tsx) drop-zone candidate decoder with verified-green highlighting + signature check, [/employer/jd](app/employer/jd/page.tsx) JD ingestion with Transparency View, [/employer/search](app/employer/search/page.tsx) skill-first filtering, [/employer/[id]](app/employer/%5Bid%5D/page.tsx) candidate detail
- **Policymaker** — [/policymaker](app/policymaker/page.tsx) "National Human Capital Command Center" with 3 KPIs (Skill Divergence Index, Automation Hotspots, ROI on Training), [/policymaker/skill-gaps](app/policymaker/skill-gaps/page.tsx) heatmap, [/policymaker/sectors](app/policymaker/sectors/page.tsx) time-series, [/policymaker/invest](app/policymaker/invest/page.tsx) adjustable weights + CSV, [/policymaker/divergence](app/policymaker/divergence/page.tsx) supply vs demand, [/policymaker/config](app/policymaker/config/page.tsx) white-label config validator, [/policymaker/ecosystem](app/policymaker/ecosystem/page.tsx) API key / tenant management

Plus [/integrate](app/integrate/page.tsx) "Integration Reference (Prototype)" with the full API contract and production-vs-prototype disclosure, and [/about/limits](app/about/limits/page.tsx) honest limits.

## Architecture

```
/app
  /(youth)/                     ← entry, profile (Passport), opportunities
  /navigator/                   ← caseload, bulk intake, per-profile, impact
  /employer/                    ← candidate decoder, JD decoder, skill search, detail
  /policymaker/                 ← Command Center, heatmap, sectors, invest, divergence, config, ecosystem
  /share/[token]                ← read-only profile for employer share links
  /integrate                    ← Integration Reference (Prototype)
  /about/limits                 ← Honest limits
  /api
    /skills-map                 ← free-text → ESCO (mock; Claude swap ready)
    /map-job-description        ← JD → ISCO + ESCO with highlight spans
    /match                      ← profile → ranked opportunity cards
    /skills-catalog             ← read-only ESCO/ISCO catalog
    /policymaker/aggregate      ← Command Center payload
    /policymaker/validate-config← schema report for uploaded configs
/lib
  /config/countries.ts          ← GH, BD active; VN, KE, BR stubs
  /data-loaders/                ← 9 typed loaders (ILO FoW added)
  /risk-calibration.ts          ← near-term + V3.0 final-risk formulas
  /returns-to-education.ts
  /skill-match.ts
  /esco-mapper.ts               ← mock + Claude prompt; emits XAI explanations
  /jd-mapper.ts                 ← JD → ISCO/ESCO + highlight spans
  /wittgenstein-implications.ts
  /human-capital-kpis.ts        ← Skill Divergence, Automation Hotspots, ROI
  /profile-schema.ts            ← unmapped.profile/v1 JSON-LD + sign/validate
  /profile-v1-builder.ts        ← youth + navigator → v1 profile
  /share-token.ts               ← base64url profile encoding
  /verify-signatures.ts         ← recompute SHA-256 for audit trail
  /resilience.ts                ← adjacent-skill coaching suggestions
  /profile-store.ts             ← Zustand, localStorage (youth)
  /navigator-store.ts           ← Zustand, localStorage (navigator)
  /employer-store.ts            ← Zustand, localStorage (employer)
  /ecosystem-store.ts           ← Zustand, localStorage (policymaker API keys)
  /market-signal-store.ts       ← cross-role JD log → divergence heatmap
```

## User-flow coverage (spec rules)

| V3.0 rule | Where it lives |
|---|---|
| R1 Explainable AI on both youth and employer | `lib/esco-mapper.ts#explanations`, `lib/jd-mapper.ts#highlights` + `/employer/jd` Transparency View |
| R2 Contextual calibration — Final_Risk = (global × connectivity) + (1 − skill_durability) | `lib/risk-calibration.ts#calibrateRisk` (produces both near-term and V3.0 final risk) |
| R3 No hardcoding — all taxonomic labels + matching logic from AppConfig | `lib/config/countries.ts`, `/policymaker/config` white-label uploader, `lib/data-loaders/*` source-labeled envelopes |

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

## Data sources — 9 live, roadmap listed

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

Integration roadmap (documented, not wired): WB Human Capital Index, WB GLD, WB STEP, UN Population Projections, UNESCO UIS, Global Findex, WGI, B-READY, ILO LFGS, UN SDG 5.

## Portability — unmapped.profile/v1

Youth self-serve and navigator-mediated paths emit the same JSON-LD:

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
