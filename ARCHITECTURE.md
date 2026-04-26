# Architecture

## Mental model in one sentence

There is no database. All reference data lives in `public/data/*.json`. All user state lives in the browser (Zustand → localStorage). The server only runs computation — it reads static files, runs logic, and returns JSON.

---

## Layers

```
┌─────────────────────────────────────────────────────────┐
│  BROWSER                                                │
│                                                         │
│  Zustand stores (localStorage)                          │
│  ├── lib/profile-store.ts      ← youth answers + mapping│
│  └── lib/navigator-store.ts    ← NGO caseload           │
│                                                         │
│  Pages (app/)                                           │
│  ├── (youth)/           ← Amara's flow                  │
│  ├── employer/          ← employer flow                  │
│  ├── navigator/         ← NGO/navigator flow             │
│  └── policymaker/       ← policymaker dashboard          │
└────────────────┬────────────────────────────────────────┘
                 │ fetch()
┌────────────────▼────────────────────────────────────────┐
│  NEXT.JS API ROUTES  (app/api/)                         │
│                                                         │
│  POST /api/skills-map          ← text → ESCO/ISCO       │
│  POST /api/map-job-description ← JD → ESCO/ISCO         │
│  GET  /api/skills-catalog      ← ESCO labels lookup     │
│  POST /api/match               ← opportunity cards       │
│  GET  /api/policymaker/aggregate ← dashboard data       │
│  POST /api/policymaker/validate-config                  │
└────────────────┬────────────────────────────────────────┘
                 │ imports
┌────────────────▼────────────────────────────────────────┐
│  ENGINE  (lib/)                                         │
│                                                         │
│  lib/esco-mapper.ts        ← text → ESCO URIs           │
│  lib/jd-mapper.ts          ← JD text → ESCO URIs        │
│  lib/skill-match.ts        ← ESCO overlap → ranked occ. │
│  lib/risk-calibration.ts   ← Final_Risk formula         │
│  lib/resilience.ts         ← adjacent skill recs        │
│  lib/profile-schema.ts     ← ProfileV1 JSON-LD schema   │
│  lib/profile-v1-builder.ts ← builds exportable profile  │
│  lib/config/countries.ts   ← AppConfig (5 countries)    │
└────────────────┬────────────────────────────────────────┘
                 │ fs.readFile()
┌────────────────▼────────────────────────────────────────┐
│  DATA  (public/data/*.json)  — static, committed        │
│                                                         │
│  esco_skills.json          ← ~100 ESCO skill URIs+labels│
│  esco_occupations.json     ← occupations + essentialSkills│
│  occupations_joined.json   ← ESCO × O*NET × Frey-Osborne│
│  isco08.json               ← ISCO-08 code labels        │
│  frey_osborne.json         ← automation probability/occ │
│  ilo_fow_tasks.json        ← routine/cognitive shares   │
│  ilostat_earnings.json     ← wages by sector+country    │
│  ilostat_employment.json   ← employment by sector+year  │
│  wittgenstein.json         ← edu projections 2025-2035  │
│  wdi.json                  ← World Bank indicators      │
│  wbes.json                 ← Enterprise Survey signals  │
│  onet_tasks.json           ← task descriptions per occ  │
└─────────────────────────────────────────────────────────┘
```

---

## Request flows — trace an endpoint top to bottom

### Flow 1: Youth submits skills form

```
app/(youth)/page.tsx
  └── POST /api/skills-map  { education, workText, toolsText, languages, aspirationsText }
        └── lib/esco-mapper.ts :: mapSkills()
              ├── [if ANTHROPIC_API_KEY] runClaude()   ← STUB, not yet implemented
              └── [else]               runMock()       ← keyword regex rules
                    ├── reads public/data/esco_skills.json   (validate URIs)
                    ├── reads public/data/esco_occupations.json (ISCO codes)
                    └── returns SkillMapResult {
                          esco_skills: string[]     ← ESCO URIs
                          isco_occupations: string[] ← ISCO codes
                          confidence: number
                          explanations[]             ← which phrase → which skill (breadcrumb)
                        }
        ← stored in Zustand profile-store (localStorage)
        → router.push('/profile')
```

### Flow 2: Youth views opportunities

```
app/(youth)/opportunities/page.tsx
  └── POST /api/match  { country, profileSkillUris }
        ├── reads esco_occupations.json  → rankMatches() (ESCO overlap)
        ├── reads occupations_joined.json → frey_osborne_raw per occupation
        ├── reads ilo_fow_tasks.json     → routine/cognitive share per ISCO
        ├── reads ilostat_earnings.json  → wages by sector
        ├── reads ilostat_employment.json → growth trends
        ├── reads wittgenstein.json      → education projection implication
        ├── lib/risk-calibration.ts :: calibrateRisk()
        │     Formula A: near_term = fo_raw × infra_factor × task_composition_factor
        │     Formula B: Final_Risk = (fo_raw × infra_delay) + (1 − skill_complexity)
        │     country config from lib/config/countries.ts (broadband, routineTaskShare)
        └── returns OpportunityCard[] — each card has wage, growth, risk, pathway, tasks
```

### Flow 3: Employer pastes job description

```
app/employer/jd/page.tsx
  └── POST /api/map-job-description  { text }
        └── lib/jd-mapper.ts :: mapJobDescription()
              ├── reads esco_skills.json
              ├── reads esco_occupations.json
              ├── runs same keyword rules as esco-mapper
              └── returns JdMapResult {
                    esco_skills[]
                    isco_top_occupation
                    highlights[]     ← character spans for UI highlighting
                    explanations[]   ← "we matched X because you wrote Y"
                  }
        → employer then calls /api/match with the JD's esco_skills
          to find candidate profiles that overlap
```

### Flow 4: NGO verifies a skill

```
app/navigator/[id]/page.tsx
  └── lib/navigator-store.ts :: addValidation()
        ← pure client-side, writes to localStorage
        ← no API call — verification is stored in the browser
        └── NavigatorProfile.validations[] gets a new entry with:
              { skillUri, method, date, signature: SHA-256(id+skill+method+date+note) }

  When profile is exported (JSON-LD download):
  lib/profile-v1-builder.ts :: buildNavigatorProfileV1()
    → ProfileV1.verifications[] includes all signatures
```

### Flow 5: Policymaker dashboard

```
app/policymaker/skill-gaps/page.tsx  (or sectors/ or divergence/)
  └── GET /api/policymaker/aggregate?country=GH
        ├── reads all data files in parallel (Promise.all)
        ├── lib/human-capital-kpis.ts :: skillDivergenceIndex()
        ├── lib/human-capital-kpis.ts :: automationHotspots()
        ├── lib/human-capital-kpis.ts :: roiOnTraining()
        ├── lib/risk-calibration.ts :: calibrateRisk() per occupation
        └── returns full dashboard envelope:
              { sectors[], occupation_risks[], wittgenstein, kpis, wbes, wdi }
```

---

## How country-switching works

`lib/config/countries.ts` is the AppConfig. It holds:
- `broadbandPenetration` → feeds `infrastructure_factor` in risk formula
- `routineTaskShare` → fallback when ILO per-occupation data is absent
- `educationLevels`, `languages` → drives Youth form UI
- `trainingProviders` → shown on opportunity cards
- `opportunityEmphasis` → changes which cards are surfaced first

To switch country: the `CountrySwitcher` component calls `useProfile.setCountry(code)`. Every subsequent API call passes `country` in its body. All logic reads from `COUNTRIES[country]`. **No code change needed — just change the country code.**

To add a new country: add one entry to `COUNTRIES` in `lib/config/countries.ts` and add `ilostat_earnings` + `ilostat_employment` rows for that country in the JSON files.

---

## Where to expand things

### Upgrade the skill mapper from keyword → AI
**File:** `lib/esco-mapper.ts`, function `runClaude()` (line 179)
The harness is already written — validation against `validUris`, retry logic, error handling. Just implement the body:
```typescript
async function runClaude(input: SkillMapInput): Promise<SkillMapResult> {
  const client = new Anthropic();
  // 1. Build system prompt with esco_skills as allowed URI list
  // 2. Call client.messages.create(...)
  // 3. Parse returned URIs, validate against validUris
  // 4. Return SkillMapResult
}
```
Set `ANTHROPIC_API_KEY` in `.env.local` and the mock is bypassed automatically.

### Add a new API endpoint
Create `app/api/your-thing/route.ts`. Import data loaders from `lib/data-loaders/`. Import engine functions from `lib/`. Return `NextResponse.json(...)`. That's it — no router registration needed (Next.js picks it up by file path).

### Add a new data signal
1. Add the JSON file to `public/data/yourdata.json` with the envelope format:
   ```json
   { "source": "Your Source Name", "fetched_at": "2026-04-26", "values": [...] }
   ```
2. Create `lib/data-loaders/yourdata.ts`:
   ```typescript
   export async function getYourData(): Promise<Sourced<YourType[]>> {
     return readEnvelope<YourType[]>('yourdata.json');
   }
   ```
3. Import and call it in the API route that needs it.

### Add a new country
```typescript
// lib/config/countries.ts
export type CountryCode = 'GH' | 'BD' | 'VN' | 'KE' | 'BR' | 'NG'; // add here

const COUNTRIES = {
  NG: {
    code: 'NG', name: 'Nigeria', broadbandPenetration: 45,
    routineTaskShare: 0.50, ...
  }
}
```
Then add `ilostat_earnings` + `ilostat_employment` rows for `NG` to the JSON files.

### Change what the risk formula does
`lib/risk-calibration.ts` — both formulas are in `calibrateRisk()`. All inputs are typed. Change the math, the output type updates throughout automatically.

---

## What does NOT exist (and where you'd put it if you built it)

| Thing | Where it would go |
|---|---|
| Persistent server-side profile storage (DB) | `lib/db/` + a new data-store API route |
| Employer login / saved searches | `lib/employer-store.ts` exists as a stub — wire it |
| Real-time candidate feed (employer sees new profiles) | Server-Sent Events in a new `app/api/feed/route.ts` |
| Claude-powered skill mapper | `lib/esco-mapper.ts :: runClaude()` — stub ready |
| Semantic embedding matcher (offline, no API key) | Separate FastAPI microservice at `/embed`, called from `runClaude` fallback |
| Multi-language UI (Twi, Bengali, etc.) | `messages/en.json` is the string file — add `messages/tw.json`, toggle via `lib/i18n.ts` |
