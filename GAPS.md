# Backend Gaps & MVP Expansion Roadmap

> Status snapshot: Sunday 26 Apr 2026  
> Audience: Akshat (backend) — creative whitespace for MVP iteration

---

## TL;DR — Where Things Stand

The current backend is a **well-structured scaffold** that satisfies the judge's "at least two modules" bar on paper but has several layers that are either stubs, naïve proxies, or entirely absent. The three biggest honest gaps are:

1. **Skill mapping is keyword regex** — deterministic, brittle, and covers ~35 patterns against 13,890 ESCO skills
2. **No server-side persistence** — every user, employer, and NGO record dies when the browser tab closes
3. **Data coverage is thin** — most of the econometric signals the brief *requires to be surfaced visibly* are loaded as small static JSON stubs, not the real datasets

The opportunity is that the **wiring is already in place** for all three. This document maps what exists, what's missing, and where creative engineering decisions live.

---

## Module 1 — Skills Signal Engine

### What's implemented
| Component | State | Notes |
|---|---|---|
| `mapSkills()` in `lib/esco-mapper.ts` | ✅ Wired | Runs `runMock()` — keyword regex |
| ESCO subset loaded | ✅ ~100 skills | `public/data/esco_skills.json` |
| ISCO-08 mapping | ✅ Count-based overlap | `lib/skill-match.ts` |
| Per-skill explanation breadcrumb | ✅ XAI field | `explanations[]` in `SkillMapResult` |
| JSON-LD profile schema | ✅ Defined | `lib/profile-schema.ts` |
| Profile export (download) | ✅ Working | `lib/profile-v1-builder.ts` |
| NGO verification signature | ✅ Client-side | SHA-256 in `lib/navigator-store.ts` |
| JD mapper for employers | ✅ Same keyword | `lib/jd-mapper.ts` |
| `runClaude()` stub | 🔴 Throws error | Body is empty — must be implemented |

### What's missing / naïve

**Skill mapper — the critical gap**  
`runMock()` uses 35 hardcoded regexes. It fails completely on:
- Indirect language: *"helped customers troubleshoot their devices"* → no `customer service` match
- Synonyms: *"built apps"* → no JavaScript match
- Non-English input even though the i18n scaffold exists
- Compound informal skills: *"taught myself from YouTube"* → zero signal

The real ESCO taxonomy has **13,890 skills** and **3,008 occupations**. The current subset covers ~100 skills focused on tech/trades — it misses most of the LMIC informal economy (domestic work, petty trade, market vending, brick-making, hawking).

**Matching algorithm — too flat**  
`rankMatches()` in `lib/skill-match.ts` scores occupations by raw overlap count with no weighting. Problems:
- All skills are treated as equally important — `driving` and `Python` have the same weight
- No consideration of *essential* vs *optional* skill distinction beyond what ESCO pre-marks
- No partial credit for adjacent/transferable skills (e.g., HTML → CSS is known proximity)
- No IDF weighting: rare skills that strongly signal an occupation are treated the same as common skills

**NGO verification is browser-local**  
The SHA-256 signature is generated and stored in `localStorage`. It cannot:
- Be verified by another party (no shared secret or public key)
- Survive device change
- Be audited by an employer receiving the JSON-LD download

**ESCO subset gaps for LMIC context**  
The 100 loaded skills are biased toward the tech sector. Missing entire clusters:
- Domestic & care work (huge informal sector in Sub-Saharan Africa, South Asia)
- Agricultural value chain (post-harvest, storage, transport)
- Informal trade skills (pricing, negotiation, inventory)
- Construction trades beyond welding/plumbing
- Healthcare auxiliary (community health worker, pharmacy dispensing)

---

### Creative engineering decisions here

| Decision | Options | Notes |
|---|---|---|
| **Skill mapper brain** | Claude API (stub ready) / local embeddings / BM25 / TF-IDF over ESCO labels | Embeddings give semantic match without API cost; BM25 is surprisingly strong for short texts |
| **ESCO subset expansion** | Fetch the full 13,890-skill ESCO API and store a larger static extract | The `scripts/data-prep/fetch_esco.py` exists — run it with wider filters |
| **Transferability graph** | Build a skill adjacency graph (ESCO `broaderSkill` links + O*NET crosswalks) and traverse it for gap-filling suggestions | This would unlock "Amara knows X, she's 2 skills away from occupation Y" narrative |
| **Verification portability** | Replace SHA-256 with an Ed25519 keypair per NGO (private key stays with NGO, public key is in the JSON-LD) | Makes verification machine-checkable by any employer, not just printable |
| **Informal skill taxonomy** | Annotate the ESCO subset with "informal equivalent labels" in Twi, Bengali, etc. so the form prompts can be in local language | This is the UX hook that makes the brief's "human-readable, owned by Amara" requirement real |

---

## Module 2 — AI Readiness & Displacement Risk Lens

### What's implemented
| Component | State | Notes |
|---|---|---|
| `calibrateRisk()` — Formula A (near-term) | ✅ Solid | `lib/risk-calibration.ts` |
| `calibrateRisk()` — Formula B (Final_Risk V3) | ✅ Solid | Same file |
| Frey-Osborne data loaded | ✅ | `public/data/frey_osborne.json` |
| ILO FoW task indices | ✅ Partial | `public/data/ilo_fow_tasks.json` |
| Wittgenstein 2025-2035 projections | ✅ Loaded | `public/data/wittgenstein.json` |
| `infrastructure_delay_factor` (broadband) | ✅ Country config | `lib/config/countries.ts` |
| Adjacent skill recommendations | ✅ Stub | `lib/resilience.ts` |
| `RiskLens` component | ✅ Exists | `components/RiskLens.tsx` |

### What's missing / naïve

**The broadband-only infrastructure model is too thin**  
The `infrastructure_delay_factor` formula is `0.3 + 0.7 × (broadband/100)`. This proxies "automation readiness" entirely by mobile broadband penetration. In reality, LMIC automation barriers include:
- **Power reliability** (load-shedding in Ghana/Nigeria makes cloud-dependent automation unreliable)
- **Smartphone vs desktop ratio** (automation tools differ; a phone-only economy has different risk profile)
- **Formality rate** (informal work has structurally lower automation exposure regardless of task mix)
- **Capital access** (SMEs in LMICs can't afford automation equipment even if digital infra exists)

None of these are currently modeled. The ITU Digital Development data is cited in the brief but not in the data files.

**`resilience.ts` is thin**  
Adjacent skill recommendations (`lib/resilience.ts`) currently return a hardcoded or minimal list. A real resilience engine would:
- Use the ESCO `broaderSkill` / `narrowerSkill` taxonomy graph
- Cross-reference with O*NET task content to find which skills are additive
- Weight suggestions by local labor demand (ILO employment growth by sector)

**Wittgenstein data not connected to user-facing narrative**  
The projections are loaded and passed to the policymaker dashboard, but there's no clear path from "Amara is in Ghana, her education level is secondary, here is how her cohort's trajectory looks from 2025-2035" narrative that the brief explicitly calls for. The `lib/wittgenstein-implications.ts` file exists but its connection to the youth flow is unclear.

**No World Bank STEP data**  
The brief specifically calls out STEP (Skills measurement from LMIC contexts) as a required data source. Not present in `public/data/`. This would be the most direct evidence of skill levels in developing countries rather than inferring from task indices.

**Formality / informality not modeled**  
The brief and its example persona (Amara, phone repair, informal economy) center on informal work. The risk model has no concept of:
- Formal vs informal employment likelihood by occupation
- Informality as a risk buffer (informal jobs are harder to automate via institutional deployment)
- The transition risk when formalizing (automation accelerates at formalization boundary)

---

### Creative engineering decisions here

| Decision | Options | Notes |
|---|---|---|
| **Multi-factor infrastructure index** | Composite of broadband + power reliability (WDI EG.ELC.ACCS.ZS) + ITU mobile penetration + formality rate | More defensible formula in Q&A than pure broadband |
| **Gender disaggregation** | Split risk scores by M/F given ILOSTAT gender × sector data | The brief appendix lists WBL 2024 and ILO gender statistics — surfacing female LMIC automation risk would be a standout angle |
| **Informality risk buffer** | Add `informality_factor` to risk calibration — informal occupations get a delay multiplier | Uses ILOSTAT informality data already in scope |
| **Wittgenstein narrative engine** | Given `country + education_level`, generate a "your cohort in 2030" projection sentence | Concrete, Amara-first framing the brief explicitly asks for |
| **STEP data integration** | Fetch/embed a STEP subset for Ghana/Bangladesh/Vietnam | The one signal that provides direct LMIC skill-level evidence rather than proxies |

---

## Module 3 — Opportunity Matching & Econometric Dashboard

### What's implemented
| Component | State | Notes |
|---|---|---|
| `/api/match` endpoint | ✅ Wired | Calls `rankMatches()` + risk calibration |
| `OpportunityCard[]` structure | ✅ Defined | Includes wage, growth, risk |
| ILOSTAT earnings loaded | ✅ Partial | `public/data/ilostat_earnings.json` |
| ILOSTAT employment loaded | ✅ Partial | `public/data/ilostat_employment.json` |
| WDI indicators loaded | ✅ Stub | `public/data/wdi.json` |
| WBES signals loaded | ✅ Stub | `public/data/wbes.json` |
| `/api/policymaker/aggregate` | ✅ Wired | Returns `{ sectors, occupation_risks, wittgenstein, kpis, wbes, wdi }` |
| `human-capital-kpis.ts` | ✅ Exists | `skillDivergenceIndex`, `automationHotspots`, `roiOnTraining` |
| Returns-to-education | ✅ Exists | `lib/returns-to-education.ts` |

### What's missing / naïve

**The two required "visibly surfaced" econometric signals are buried**  
The brief requires *"at least two real econometric signals visibly to the user — not buried in the algorithm."* Currently:
- Wages appear as a card field but the sourcing/methodology is not surfaced to the user
- Employment growth is shown but with no year-range context
- Wittgenstein projections exist in the policymaker view but are absent from the youth opportunity cards
- The `SourceLabel` component exists in `components/ui/` but is it actually used on the data that matters?

**ILOSTAT data is likely thin stubs**  
The JSON files were fetched by scripts in `scripts/data-prep/` but the coverage may be:
- Only a few sectors per country
- Only the 5 current countries
- Not disaggregated by gender or age cohort (which is required for the brief's LMIC framing)

**WDI and WBES are almost certainly placeholder stubs**  
Both files exist but given the project timeline, they likely contain minimal data. The Human Capital Index, UNESCO enrollment rates, and B-READY regulatory indicators the brief mentions are not confirmed present.

**No demand-side forecast**  
The matching engine is purely supply-side (profile → occupations). There's no model of:
- Which sectors are hiring in country X right now
- Which skills will be in demand in 2027 (combining employment trends + automation displacement)
- Which training pathways have the highest return-on-investment given local wage data

**Employer side is a stub**  
`lib/employer-store.ts` exists but is noted as needing wiring. The employer flow (paste JD → see candidate profiles that overlap) is described in flows but:
- No cross-profile search
- No saved searches
- No real-time feed
- No employer-facing API beyond `/api/map-job-description`

**No informality sector lens in policymaker view**  
Ghana's GDP is ~40% informal economy. The dashboard has no module showing:
- Share of employment that is informal by sector
- Wage differential formal vs informal
- Which interventions (vocational training, formalization incentives) have evidence from WBES

---

### Creative engineering decisions here

| Decision | Options | Notes |
|---|---|---|
| **Demand-side signal** | Combine WBES "hiring difficulty" signal with ILO employment growth → "heat index" per occupation | This is what separates honest matching from aspirational matching — the brief explicitly calls this out |
| **Pathway engine** | Given current profile → target occupation, compute a minimal skill acquisition path using BFS on the ESCO graph | The "what would it take" answer that turns a risk score into an actionable plan |
| **Informality module** | ILOSTAT informality by sector + WBES skills constraints → show employers where informal talent pools are concentrated | Dual-sided insight useful to both youth ("your sector is X% informal — here's what that means") and employers |
| **Gender equity lens** | ILO gender statistics + WBL 2024 → overlay female employment share and wage gaps on opportunity cards | The brief appendix is heavy on gender data sources — a female-disaggregated view would be a distinguishing feature |
| **ROI-on-training calculator** | `returns-to-education.ts` + local training provider cost → "this 3-month course costs X, raises expected wages by Y" | Makes the policymaker ROI metric concrete for Amara |
| **WBES skills constraint heatmap** | Use WBES "% of firms citing skills as major obstacle" by sector to highlight where youth skills are most needed | Employer-side econometric signal that the brief explicitly requires surfaced |

---

## Data Coverage Gaps

The brief lists these required data sources. Here's the honest status:

| Source | Required? | In `public/data/`? | Coverage |
|---|---|---|---|
| ILO ILOSTAT wages | ✅ Required | ✅ `ilostat_earnings.json` | Partial — 5 countries, some sectors |
| ILO ILOSTAT employment | ✅ Required | ✅ `ilostat_employment.json` | Partial |
| ILO ISCO-08 | ✅ Required | ✅ `isco08.json` | Full labels |
| ILO FoW task indices | ✅ Required | ✅ `ilo_fow_tasks.json` | Partial |
| Frey-Osborne automation | ✅ Required | ✅ `frey_osborne.json` | Present |
| ESCO Skills Taxonomy | ✅ Required | ✅ `esco_skills.json` | ~100/13,890 skills |
| O*NET task content | ✅ Required | ✅ `onet_tasks.json` | Partial |
| Wittgenstein projections | ✅ Required | ✅ `wittgenstein.json` | Present |
| World Bank WDI | ✅ Required | ✅ `wdi.json` | Unknown coverage |
| World Bank WBES | ✅ Required | ✅ `wbes.json` | Unknown coverage |
| World Bank STEP | Strongly recommended | ❌ Missing | Not present |
| ITU Digital Development | For infra model | ❌ Missing | Not present |
| UN Population Projections | For divergence | ❌ Missing | Not present |
| UNESCO enrollment/completion | Mentioned | ❌ Missing | Not present |
| Human Capital Index | Mentioned | ❌ Missing | Not present |
| ILO informality statistics | Brief appendix | ❌ Missing | Not present |
| World Governance Indicators | Brief appendix | ❌ Missing | Not present |
| Women, Business and the Law 2024 | Brief appendix | ❌ Missing | Not present |
| B-READY database | Brief appendix | ❌ Missing | Not present |

---

## Infrastructure / Architecture Gaps

### Database — nothing persists server-side

Current: everything lives in `localStorage` via Zustand.

Problems this causes:
- **Amara can't share her profile** across devices (the QR code / share token only encodes state, there's no server that holds it)
- **NGO caseworkers can't access profiles** they entered on one machine from another
- **Employers can't browse profiles** — there's no pool to query
- **Analytics are impossible** — aggregate policymaker data is computed over static JSON, not real user data

Expansion path:
```
lib/db/
  ├── profile-repository.ts   ← CRUD for ProfileV1
  ├── validation-log.ts       ← append-only verification events
  └── employer-searches.ts    ← saved JD → skill queries
app/api/profiles/
  ├── [id]/route.ts
  └── search/route.ts
```
SQLite via Turso/libSQL is zero-infrastructure for a hackathon and gives real persistence with a familiar SQL interface. Alternatively, a simple KV store (Upstash Redis) for profile tokens would solve the sharing problem immediately.

### Caching — every request re-reads all JSON files

Every API call does `fs.readFile()` for each data file it needs. With large ESCO/O*NET files, this compounds. The `_read.ts` loader has no in-process cache.

Quick fix: module-level `Map` cache with TTL — 5 lines of code, prevents re-parsing 10MB of JSON on every request.

### Skill mapper — no fallback between Claude failure and keyword regex

The current fallback chain is: Claude API → throw → `upstream_error` returned. The keyword mock is only called when `ANTHROPIC_API_KEY` is absent. There's no graceful degradation where Claude fails at runtime and the regex mock picks up.

Better chain: Claude → (timeout/error) → local embeddings → keyword mock, with confidence score declining at each step.

### Security surface

| Issue | Risk | Fix |
|---|---|---|
| No input length limits | DoS via large text to skill mapper | `maxLength` validation in route handlers |
| SHA-256 verification signature is deterministic (no salt) | Signature for same `(id, skill, date)` is always identical — replay attack | Add a random nonce to the signature payload |
| No rate limiting on `/api/skills-map` | Claude API bill risk | `next-rate-limit` or Upstash rate limiter |
| `policymaker/validate-config` accepts JSON upload | Prototype pollution risk | JSON schema validation before any key access |

---

## Quick Wins for MVP (by impact/effort)

### Tier 1 — High impact, low effort (< 2 hours each)

1. **Implement `runClaude()` in `lib/esco-mapper.ts`** — the harness, retry logic, and validation are all written. The body is 30 lines of Anthropic SDK calls. This turns the single most visible gap into a strength.

2. **In-process JSON cache in `lib/data-loaders/_read.ts`** — a module-level `Map<string, {value, ts}>` prevents re-reading 10MB of JSON on every request. 5 lines.

3. **Surface the Wittgenstein projection on the youth Opportunities page** — the data is already fetched in the `/api/match` response. Showing "In your region, secondary-educated workers in this sector are projected to grow/shrink by X% by 2030" is literally the brief's example requirement.

4. **Add informality flag to opportunity cards** — ILOSTAT has employment-by-formality data. Adding an "X% informal" badge to each card is a concrete LMIC signal the judges will notice.

### Tier 2 — High impact, moderate effort (2–6 hours each)

5. **Expand ESCO skill subset to 500–800 skills** — rerun `scripts/data-prep/fetch_esco.py` with broader ISCO group filters targeting informal LMIC occupations. This directly improves mapping quality without changing any algorithm.

6. **Add IDF weighting to `rankMatches()`** — weight each skill by inverse frequency across all occupations. Rare skills that strongly signal an occupation should score higher than ubiquitous ones. 15 lines of code, measurably better ranking.

7. **Add ITU broadband + power access data** — two WDI indicators (`IT.NET.BBND.P2`, `EG.ELC.ACCS.ZS`) turn the single-variable infrastructure model into a defensible composite. These are downloadable as static JSON from the World Bank API.

8. **Implement a minimal profile store API endpoint** — `POST /api/profiles` that writes to a temp file or in-memory store. Unblocks the sharing flow and employer search without full DB setup.

### Tier 3 — Ambitious, weekend-worthy

9. **Skill adjacency graph** — parse the ESCO `broaderSkill`/`narrowerSkill` links into a graph, run BFS from profile skills to target occupation, output "you need 3 more skills, here's the shortest path." This is the killer feature for the "honest, grounded matching" requirement.

10. **Local embeddings for skill mapping** — use `@xenova/transformers` (runs in Node.js, no GPU) with a multilingual embedding model. Embed the ESCO skill descriptions once at build time, embed the user's free text at runtime, return top-k by cosine similarity. Works offline, no API key, handles informal language and non-English input.

11. **Gender-disaggregated risk and opportunity view** — using ILO gender statistics + WBL 2024 data, add a toggle to the policymaker dashboard that breaks out female vs. male automation exposure and wage gaps by sector. This is a creative angle that speaks directly to the brief's appendix emphasis on gender data.

---

## What Doesn't Exist at All (and Where It Would Go)

| Feature | Brief Relevance | Where to Build |
|---|---|---|
| Real profile persistence | Sharing, employer search, NGO caseload | `lib/db/` + `app/api/profiles/` |
| Verifiable credentials (W3C VC) | True cross-border portability | `lib/vc-builder.ts` wrapping `profile-v1-builder.ts` |
| Pathway engine ("3 skills away from X") | Honest grounded matching | `lib/pathway.ts` using ESCO graph |
| Multi-language UI | Country-agnostic requirement | `messages/tw.json`, `messages/bn.json` — scaffold exists in `lib/i18n.ts` |
| Employer profile pool + search | Employer flow completion | `lib/employer-store.ts` wired to server-side storage |
| Real-time ILOSTAT/WDI refresh | "Real data" judging criterion | Replace static JSON with a scheduled fetch in a cron route |
| STEP data integration | "Rare direct LMIC skill evidence" | Fetch script + `public/data/step.json` + loader |
| Informality sector model | LMIC context requirement | New field in `CountryConfig` + ILOSTAT informality loader |
| Demand-side heat index | "Honest matching" requirement | Combine WBES hiring difficulty + ILO growth trends |
| Gender equity overlay | Brief appendix emphasis | ILO gender stats + WBL 2024 loader + policymaker toggle |
