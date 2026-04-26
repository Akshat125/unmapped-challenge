# Backend Gaps & MVP Expansion Roadmap

> Status snapshot: Sunday 26 Apr 2026  
> Audience: Akshat (backend) — creative whitespace for MVP iteration

Every gap below points at the **exact file** that needs editing and the **upstream data source** that should replace the seed.

---

## TL;DR — Where Things Stand

The current backend is a **well-structured scaffold** that satisfies the judge's "at least two modules" bar on paper but has several layers that are stubs, naïve proxies, or absent. The three biggest honest gaps:

1. **Skill mapping is keyword regex** — deterministic, brittle, ~35 patterns against 13,890 ESCO skills → [`lib/esco-mapper.ts`](lib/esco-mapper.ts) `runMock()`, [`lib/jd-mapper.ts`](lib/jd-mapper.ts) `RULES`
2. **No server-side persistence** — every user, employer, and NGO record dies when the tab closes → [`lib/profile-store.ts`](lib/profile-store.ts), [`lib/navigator-store.ts`](lib/navigator-store.ts), [`lib/employer-store.ts`](lib/employer-store.ts)
3. **Data coverage is thin** — every `public/data/*.json` is a hand-curated seed, not a live fetch → see "Stub Files vs. Real Sources" table below

The wiring is in place for all three. This document maps what exists, what's missing, and where creative engineering decisions live.

---

## Stub Files vs. Real Sources

Every fetcher in `scripts/data-prep/` carries a `TODO (requires network)` comment. Here is the one-line replacement plan for each.

| Stub script (in repo) | Output JSON | Real upstream source |
|---|---|---|
| [`scripts/data-prep/fetch_isco.py`](scripts/data-prep/fetch_isco.py) | [`public/data/isco08.json`](public/data/isco08.json) | [ILO ISCO-08 structure](https://www.ilo.org/public/english/bureau/stat/isco/isco08/) |
| [`scripts/data-prep/fetch_esco.py`](scripts/data-prep/fetch_esco.py) | [`public/data/esco_occupations.json`](public/data/esco_occupations.json) + [`esco_skills.json`](public/data/esco_skills.json) | [ESCO v1.1.1 CSV release](https://esco.ec.europa.eu/en/use-esco/download) — `occupations.csv` ⋈ `occupationSkillRelations.csv` ⋈ `skills.csv` |
| [`scripts/data-prep/fetch_onet.py`](scripts/data-prep/fetch_onet.py) | [`public/data/onet_tasks.json`](public/data/onet_tasks.json) | [O*NET Resource Center DB](https://www.onetcenter.org/database.html) — `Task Statements.txt` ⋈ `Occupation Data.txt` |
| [`scripts/data-prep/fetch_frey_osborne.py`](scripts/data-prep/fetch_frey_osborne.py) | [`public/data/frey_osborne.json`](public/data/frey_osborne.json) | [Oxford Martin paper appendix table](https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment/) — score per SOC code |
| [`scripts/data-prep/fetch_ilostat.py`](scripts/data-prep/fetch_ilostat.py) | [`public/data/ilostat_employment.json`](public/data/ilostat_employment.json) + [`ilostat_earnings.json`](public/data/ilostat_earnings.json) | [ILOSTAT bulk download](https://ilostat.ilo.org/data/) — `EMP_TEMP_SEX_ECO_NB_A`, `EAR_4MTH_SEX_ECO_CUR_NB_A` (+ by-education slice) |
| [`scripts/data-prep/fetch_ilo_fow.py`](scripts/data-prep/fetch_ilo_fow.py) | [`public/data/ilo_fow_tasks.json`](public/data/ilo_fow_tasks.json) | [ILO Future of Work statistics](https://ilostat.ilo.org/topics/future-of-work/) — task indices by occupation, country |
| [`scripts/data-prep/fetch_wittgenstein.py`](scripts/data-prep/fetch_wittgenstein.py) | [`public/data/wittgenstein.json`](public/data/wittgenstein.json) | [Wittgenstein Centre Data Explorer](http://dataexplorer.wittgensteincentre.org/) — country × age 20-24 × attainment, SSP2 scenario |
| [`scripts/data-prep/fetch_wdi.py`](scripts/data-prep/fetch_wdi.py) | [`public/data/wdi.json`](public/data/wdi.json) | [World Bank WDI API](https://api.worldbank.org/v2/country/{code}/indicator/{id}?format=json) — `NY.GDP.PCAP.CD`, `SL.TLF.CACT.ZS`, `SL.EMP.TOTL.SP.ZS`, `SL.UEM.NEET.ZS`, `IT.NET.BBND.P2`, `EG.ELC.ACCS.ZS` |
| [`scripts/data-prep/fetch_wbes.py`](scripts/data-prep/fetch_wbes.py) | [`public/data/wbes.json`](public/data/wbes.json) | [World Bank Enterprise Surveys](https://www.enterprisesurveys.org/) — % of firms citing inadequately-educated workforce as constraint |
| [`scripts/data-prep/crosswalks/onet_soc_isco08.csv`](scripts/data-prep/crosswalks/onet_soc_isco08.csv) | feeds [`occupations_joined.json`](public/data/occupations_joined.json) | [BLS SOC ↔ ISCO-08 crosswalk (xlsx)](https://www.bls.gov/soc/soc_2018_to_isco_08_crosswalk.xlsx) |
| *(missing)* `scripts/data-prep/fetch_step.py` | `public/data/step.json` | [World Bank STEP Skills Measurement microdata](https://microdata.worldbank.org/index.php/catalog/step) |
| *(missing)* `scripts/data-prep/fetch_itu.py` | `public/data/itu.json` | [ITU DataHub indicators](https://datahub.itu.int/) — broadband, mobile, electricity reliability |
| *(missing)* `scripts/data-prep/fetch_unesco.py` | `public/data/unesco.json` | [UNESCO UIS data browser](https://databrowser.uis.unesco.org/) — gross enrollment, completion rates |
| *(missing)* `scripts/data-prep/fetch_hci.py` | `public/data/hci.json` | [Human Capital Project — HCI dataset](https://www.worldbank.org/en/publication/human-capital) |
| *(missing)* `scripts/data-prep/fetch_wbl.py` | `public/data/wbl.json` | [Women, Business and the Law 2024](https://wbl.worldbank.org/) — index + sub-indicator scores |
| *(missing)* `scripts/data-prep/fetch_un_pop.py` | `public/data/un_pop.json` | [UN World Population Prospects 2024](https://population.un.org/wpp/) |
| *(missing)* `scripts/data-prep/fetch_wgi.py` | `public/data/wgi.json` | [Worldwide Governance Indicators](https://www.worldbank.org/en/publication/worldwide-governance-indicators) |
| *(missing)* `scripts/data-prep/fetch_bready.py` | `public/data/bready.json` | [B-READY (Business Ready)](https://www.worldbank.org/en/businessready) |

The orchestrator [`scripts/data-prep/build_occupation_subset.py`](scripts/data-prep/build_occupation_subset.py) calls each fetcher's `main()` and joins ESCO × O*NET × Frey-Osborne via the crosswalk. **The join is O*NET-first**: any occupation not present in `fetch_onet.py`'s `TASKS` dict is silently dropped from `occupations_joined.json` regardless of ESCO presence (e.g. `3514` Web technician, until manually added to all three sources).

---

## Module 1 — Skills Signal Engine

### What's implemented
| Component | State | Notes |
|---|---|---|
| `mapSkills()` in [`lib/esco-mapper.ts`](lib/esco-mapper.ts) | ✅ Wired | Runs `runMock()` — keyword regex |
| ESCO subset loaded | ✅ ~100 skills | [`public/data/esco_skills.json`](public/data/esco_skills.json) (35 entries) |
| ISCO-08 mapping | ✅ Count-based overlap | [`lib/skill-match.ts`](lib/skill-match.ts) |
| Per-skill explanation breadcrumb | ✅ XAI field | `explanations[]` in `SkillMapResult` |
| JSON-LD profile schema | ✅ Defined | [`lib/profile-schema.ts`](lib/profile-schema.ts) |
| Profile export (download) | ✅ Working | [`lib/profile-v1-builder.ts`](lib/profile-v1-builder.ts) |
| NGO verification signature | ✅ Client-side | SHA-256 in [`lib/navigator-store.ts`](lib/navigator-store.ts) |
| JD mapper for employers | ✅ Same keyword | [`lib/jd-mapper.ts`](lib/jd-mapper.ts) |
| `runClaude()` stub | 🔴 Throws error | [`lib/esco-mapper.ts:179-184`](lib/esco-mapper.ts) — body is empty |

### What's missing / naïve

**Skill mapper — the critical gap**  
[`lib/esco-mapper.ts`](lib/esco-mapper.ts) `runMock()` uses 35 hardcoded regexes (`KEYWORD_RULES`, lines 51–93). It fails on:
- Indirect language: *"helped customers troubleshoot their devices"* → no `customer service` match
- Synonyms: *"built apps"* → no JavaScript match
- Non-English input even though [`lib/i18n.ts`](lib/i18n.ts) scaffold exists
- Compound informal skills: *"taught myself from YouTube"* → zero signal

The real ESCO taxonomy has **13,890 skills** and **3,008 occupations** ([download](https://esco.ec.europa.eu/en/use-esco/download)). The current subset covers 35 skills focused on tech/trades — it misses most of the LMIC informal economy (domestic work, petty trade, market vending, brick-making, hawking).

**Skill URIs are invented placeholders**  
Every URI in [`scripts/data-prep/fetch_esco.py`](scripts/data-prep/fetch_esco.py) (`S1.1.1` … `S7.1.5`) is an internal label, not a real ESCO concept URI. Real ESCO URIs look like `http://data.europa.eu/esco/skill/4f30a5ec-46b9-4c1d-8d14-3a19ab5fb45b`. Live fetch must rewrite this and every consumer that references those URIs:
- [`lib/esco-mapper.ts`](lib/esco-mapper.ts) `KEYWORD_RULES`
- [`lib/jd-mapper.ts`](lib/jd-mapper.ts) `RULES`
- [`lib/resilience.ts`](lib/resilience.ts) `ADJACENT`
- [`scripts/data-prep/fetch_esco.py`](scripts/data-prep/fetch_esco.py) `ESSENTIAL_SKILLS`

**Matching algorithm — too flat**  
[`rankMatches()`](lib/skill-match.ts) scores by raw overlap count with no weighting:
- All skills equally important — `driving` and `Python` weighted the same
- No partial credit for adjacent/transferable skills
- No IDF weighting

**NGO verification is browser-local**  
SHA-256 signature in [`lib/navigator-store.ts`](lib/navigator-store.ts) cannot be verified by another party (no shared secret/public key), survive device change, or be audited by a downstream employer.

**ESCO subset gaps for LMIC context**  
Missing entire clusters of informal-economy skills: domestic & care work, agricultural value chain (post-harvest, storage, transport), informal trade (pricing, negotiation, inventory), construction trades beyond welding/plumbing, healthcare auxiliaries.

---

### Creative engineering decisions here

| Decision | Options | Where it lives |
|---|---|---|
| **Skill mapper brain** | Claude API / local embeddings (`@xenova/transformers`) / BM25 / TF-IDF | Implement [`lib/esco-mapper.ts`](lib/esco-mapper.ts) `runClaude()` |
| **ESCO subset expansion** | Run [`fetch_esco.py`](scripts/data-prep/fetch_esco.py) against the [ESCO v1.1.1 CSV release](https://esco.ec.europa.eu/en/use-esco/download) with broader ISCO group filters | Replace `OCCUPATIONS`, `SKILLS_POOL`, `ESSENTIAL_SKILLS` dicts |
| **Transferability graph** | Build skill adjacency from ESCO `broaderSkill` links + O*NET crosswalks | New `lib/skill-graph.ts`, replaces hardcoded [`lib/resilience.ts`](lib/resilience.ts) `ADJACENT` |
| **Verification portability** | Replace SHA-256 with Ed25519 keypair per NGO | Refactor signature logic in [`lib/navigator-store.ts`](lib/navigator-store.ts) + [`lib/verify-signatures.ts`](lib/verify-signatures.ts) |
| **Informal skill taxonomy** | Annotate ESCO subset with informal-equivalent labels in Twi, Bengali, etc. | Extend [`scripts/data-prep/fetch_esco.py`](scripts/data-prep/fetch_esco.py) `SKILLS_POOL` schema |

---

## Module 2 — AI Readiness & Displacement Risk Lens

### What's implemented
| Component | State | Notes |
|---|---|---|
| `calibrateRisk()` Formula A (near-term) | ✅ Solid | [`lib/risk-calibration.ts`](lib/risk-calibration.ts) |
| `calibrateRisk()` Formula B (Final_Risk V3) | ✅ Solid | Same file |
| Frey-Osborne data loaded | ✅ 17 SOC codes | [`public/data/frey_osborne.json`](public/data/frey_osborne.json) |
| ILO FoW task indices | ✅ 17 ISCO codes | [`public/data/ilo_fow_tasks.json`](public/data/ilo_fow_tasks.json) — global only, no country overrides |
| Wittgenstein 2025-2035 projections | ✅ GH+BD only | [`public/data/wittgenstein.json`](public/data/wittgenstein.json) |
| `infrastructure_delay_factor` (broadband) | ✅ Country config | [`lib/config/countries.ts`](lib/config/countries.ts) `broadbandPenetration` |
| Adjacent skill recommendations | ✅ 17 hardcoded edges | [`lib/resilience.ts`](lib/resilience.ts) `ADJACENT` |
| `RiskLens` component | ✅ Exists | [`components/RiskLens.tsx`](components/RiskLens.tsx) |

### What's missing / naïve

**The broadband-only infrastructure model is too thin**  
[`lib/risk-calibration.ts`](lib/risk-calibration.ts) computes `infrastructure_delay_factor = 0.3 + 0.7 × (broadband/100)` from [`lib/config/countries.ts`](lib/config/countries.ts) `broadbandPenetration`. In reality, LMIC automation barriers also include:
- **Power reliability** ([WDI `EG.ELC.ACCS.ZS`](https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS), [ITU electricity reliability](https://datahub.itu.int/))
- **Smartphone vs desktop ratio** ([ITU mobile-broadband indicators](https://datahub.itu.int/))
- **Formality rate** ([ILO informality statistics](https://ilostat.ilo.org/topics/informality/))
- **Capital access** ([WBES financing constraint indicator](https://www.enterprisesurveys.org/))

None of these are modeled today.

**[`lib/resilience.ts`](lib/resilience.ts) is thin**  
The `ADJACENT` map (17 edges) is hand-curated. A real engine would walk the [ESCO `broaderSkill`/`narrowerSkill` graph](https://esco.ec.europa.eu/en/use-esco/download), cross-reference [O*NET task content](https://www.onetcenter.org/database.html), and weight by [ILO sector growth](https://ilostat.ilo.org/data/).

**Wittgenstein data not connected to user-facing narrative**  
[`public/data/wittgenstein.json`](public/data/wittgenstein.json) is loaded by the policymaker dashboard but [`lib/wittgenstein-implications.ts`](lib/wittgenstein-implications.ts) isn't surfaced on the youth Opportunities page. The brief explicitly calls for a "your cohort in 2030" narrative line on each opportunity card.

**No World Bank STEP data**  
The brief calls out [STEP](https://microdata.worldbank.org/index.php/catalog/step) as required. Not present in [`public/data/`](public/data/). No fetcher exists — needs new `scripts/data-prep/fetch_step.py` + new loader in [`lib/data-loaders/`](lib/data-loaders/).

**Formality / informality not modeled**  
The brief's example persona (Amara, phone repair, informal) is informal-economy. The risk model has no concept of formal vs. informal employment likelihood, informality as a buffer, or transition risk at formalization. Needs:
- New field `informality_share` in [`lib/config/countries.ts`](lib/config/countries.ts) `CountryConfig`
- New ILO informality fetcher pulling [SDG indicator 8.3.1](https://ilostat.ilo.org/topics/informality/)
- Multiplier in [`lib/risk-calibration.ts`](lib/risk-calibration.ts)

---

### Creative engineering decisions here

| Decision | Options | Where it lives |
|---|---|---|
| **Multi-factor infrastructure index** | Composite of broadband + power + mobile + formality | Refactor [`lib/risk-calibration.ts`](lib/risk-calibration.ts) `infrastructure_delay_factor` |
| **Gender disaggregation** | Split risk by M/F using ILOSTAT × sector | Extend [`scripts/data-prep/fetch_ilostat.py`](scripts/data-prep/fetch_ilostat.py) (`EMP_TEMP_SEX_AGE_ECO_NB_A`) + new policymaker toggle |
| **Informality risk buffer** | Add `informality_factor` multiplier | [`lib/risk-calibration.ts`](lib/risk-calibration.ts) + new ILO informality loader |
| **Wittgenstein narrative engine** | Country + education_level → "your cohort in 2030" sentence | Extend [`lib/wittgenstein-implications.ts`](lib/wittgenstein-implications.ts), wire into youth opportunity card |
| **STEP data integration** | Fetch [STEP](https://microdata.worldbank.org/index.php/catalog/step) subset for GH/BD/VN | New `scripts/data-prep/fetch_step.py` + `public/data/step.json` + `lib/data-loaders/step.ts` |

---

## Module 3 — Opportunity Matching & Econometric Dashboard

### What's implemented
| Component | State | Notes |
|---|---|---|
| `/api/match` endpoint | ✅ Wired | [`app/api/match/route.ts`](app/api/match/route.ts) |
| `OpportunityCard[]` structure | ✅ Defined | Includes wage, growth, risk |
| ILOSTAT earnings loaded | ✅ GH+BD only | [`public/data/ilostat_earnings.json`](public/data/ilostat_earnings.json) (6 sectors × 2 countries) |
| ILOSTAT employment loaded | ✅ GH+BD only | [`public/data/ilostat_employment.json`](public/data/ilostat_employment.json) (6 sectors × 5 years × 2 countries) |
| WDI indicators loaded | ✅ GH+BD, 4 indicators | [`public/data/wdi.json`](public/data/wdi.json) |
| WBES signals loaded | ✅ GH+BD, 3 indicators | [`public/data/wbes.json`](public/data/wbes.json) |
| `/api/policymaker/aggregate` | ✅ Wired | [`app/api/policymaker/aggregate/route.ts`](app/api/policymaker/aggregate/route.ts) |
| `human-capital-kpis.ts` | ✅ Exists | [`lib/human-capital-kpis.ts`](lib/human-capital-kpis.ts) |
| Returns-to-education | ✅ Exists | [`lib/returns-to-education.ts`](lib/returns-to-education.ts) |

### What's missing / naïve

**The required econometric signals are barely surfaced**  
The brief requires *"at least two real econometric signals visibly to the user — not buried in the algorithm."* Currently:
- Wages appear as a card field but methodology not surfaced
- Employment growth shown without year-range context
- Wittgenstein projections exist in policymaker view but absent from youth opportunity cards
- The [`SourceLabel`](components/ui/SourceLabel.tsx) component exists but isn't applied to wage/growth fields

**ILOSTAT data is thin stubs**  
[`scripts/data-prep/fetch_ilostat.py`](scripts/data-prep/fetch_ilostat.py) hardcodes 6 sectors × 5 years for **only Ghana and Bangladesh**. Vietnam, Kenya, Brazil — all present in [`lib/config/countries.ts`](lib/config/countries.ts) — have **zero employment or earnings data**. No gender or age disaggregation. Replace with bulk download from [ILOSTAT](https://ilostat.ilo.org/data/) (`EMP_TEMP_SEX_ECO_NB_A`, `EAR_4MTH_SEX_ECO_CUR_NB_A`, `EMP_TEMP_SEX_AGE_ECO_NB_A`).

**WDI and WBES are thin stubs too**  
[`fetch_wdi.py`](scripts/data-prep/fetch_wdi.py) and [`fetch_wbes.py`](scripts/data-prep/fetch_wbes.py) cover only GH+BD with 4 and 3 indicators respectively. The Human Capital Index, UNESCO enrollment rates, and B-READY regulatory indicators the brief mentions are absent — see the missing-fetcher rows in the Stub Files table above.

**No demand-side forecast**  
The matching engine in [`lib/skill-match.ts`](lib/skill-match.ts) → [`app/api/match/route.ts`](app/api/match/route.ts) is purely supply-side (profile → occupations). No model of:
- Sectors hiring in country X right now ([WBES vacancy signals](https://www.enterprisesurveys.org/))
- Skills in demand 2027 (combine [ILO employment trends](https://ilostat.ilo.org/topics/employment/) + automation displacement)
- Training pathway ROI against local wage data

**Employer side is a stub**  
[`lib/employer-store.ts`](lib/employer-store.ts) is `localStorage`-only. The employer flow has:
- No cross-profile search
- No saved searches
- No real-time feed
- Only [`app/api/map-job-description/route.ts`](app/api/map-job-description/route.ts) as employer-facing API

**No informality sector lens in policymaker view**  
[`app/api/policymaker/aggregate/route.ts`](app/api/policymaker/aggregate/route.ts) has no informality module. Ghana's GDP is ~40% informal — the dashboard needs share-of-employment-informal by sector ([ILO informality data](https://ilostat.ilo.org/topics/informality/)), wage differential formal vs informal, and intervention evidence from [WBES](https://www.enterprisesurveys.org/).

---

### Creative engineering decisions here

| Decision | Options | Where it lives |
|---|---|---|
| **Demand-side signal** | WBES "hiring difficulty" + ILO employment growth → per-occupation heat index | New `lib/demand-heat.ts` consumed in [`app/api/match/route.ts`](app/api/match/route.ts) |
| **Pathway engine** | BFS on ESCO graph from current → target occupation | New `lib/pathway.ts` using ESCO `broaderSkill` graph |
| **Informality module** | ILOSTAT informality + WBES skills constraints | New ILO informality fetcher + module in [`app/api/policymaker/aggregate/route.ts`](app/api/policymaker/aggregate/route.ts) |
| **Gender equity lens** | ILO gender stats + WBL 2024 | Extend [`fetch_ilostat.py`](scripts/data-prep/fetch_ilostat.py) with sex-disaggregated cubes + new `fetch_wbl.py` |
| **ROI-on-training calculator** | [`returns-to-education.ts`](lib/returns-to-education.ts) + provider cost | Wire into opportunity card; populate provider costs in [`lib/config/countries.ts`](lib/config/countries.ts) `trainingProviders` |
| **WBES skills constraint heatmap** | % of firms citing skills as obstacle, by sector | Extend [`fetch_wbes.py`](scripts/data-prep/fetch_wbes.py) with sector breakdown + policymaker tile |

---

## Data Coverage Gaps

| Source | Required? | In `public/data/`? | Coverage | Replacement source |
|---|---|---|---|---|
| ILO ILOSTAT wages | ✅ | ✅ [`ilostat_earnings.json`](public/data/ilostat_earnings.json) | GH + BD only, 6 sectors | [ILOSTAT bulk](https://ilostat.ilo.org/data/) |
| ILO ILOSTAT employment | ✅ | ✅ [`ilostat_employment.json`](public/data/ilostat_employment.json) | GH + BD only, no gender/age | [ILOSTAT bulk](https://ilostat.ilo.org/data/) |
| ILO ISCO-08 | ✅ | ✅ [`isco08.json`](public/data/isco08.json) | 24 unit groups | [ILO ISCO-08](https://www.ilo.org/public/english/bureau/stat/isco/isco08/) |
| ILO FoW task indices | ✅ | ✅ [`ilo_fow_tasks.json`](public/data/ilo_fow_tasks.json) | 17 ISCO codes, no country overrides | [ILO Future of Work](https://ilostat.ilo.org/topics/future-of-work/) |
| Frey-Osborne automation | ✅ | ✅ [`frey_osborne.json`](public/data/frey_osborne.json) | 17 SOC codes | [Oxford Martin paper](https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment/) |
| ESCO Skills Taxonomy | ✅ | ✅ [`esco_skills.json`](public/data/esco_skills.json) | 35 / 13,890 skills | [ESCO download](https://esco.ec.europa.eu/en/use-esco/download) |
| O*NET task content | ✅ | ✅ [`onet_tasks.json`](public/data/onet_tasks.json) | 17 SOC codes | [O*NET DB](https://www.onetcenter.org/database.html) |
| Wittgenstein projections | ✅ | ✅ [`wittgenstein.json`](public/data/wittgenstein.json) | GH + BD only | [Wittgenstein Data Explorer](http://dataexplorer.wittgensteincentre.org/) |
| World Bank WDI | ✅ | ✅ [`wdi.json`](public/data/wdi.json) | GH + BD, 4 indicators | [WDI API](https://api.worldbank.org/v2/country/all/indicator) |
| World Bank WBES | ✅ | ✅ [`wbes.json`](public/data/wbes.json) | GH + BD, 3 indicators | [Enterprise Surveys](https://www.enterprisesurveys.org/) |
| World Bank STEP | Strongly recommended | ❌ | — | [STEP microdata](https://microdata.worldbank.org/index.php/catalog/step) |
| ITU Digital Development | For infra model | ❌ | — | [ITU DataHub](https://datahub.itu.int/) |
| UN Population Projections | For divergence | ❌ | — | [WPP 2024](https://population.un.org/wpp/) |
| UNESCO enrollment/completion | Mentioned | ❌ | — | [UNESCO UIS](https://databrowser.uis.unesco.org/) |
| Human Capital Index | Mentioned | ❌ | — | [HCI](https://www.worldbank.org/en/publication/human-capital) |
| ILO informality statistics | Brief appendix | ❌ | — | [ILO informality](https://ilostat.ilo.org/topics/informality/) |
| Worldwide Governance Indicators | Brief appendix | ❌ | — | [WGI](https://www.worldbank.org/en/publication/worldwide-governance-indicators) |
| Women, Business and the Law 2024 | Brief appendix | ❌ | — | [WBL 2024](https://wbl.worldbank.org/) |
| B-READY database | Brief appendix | ❌ | — | [B-READY](https://www.worldbank.org/en/businessready) |

---

## Country Coverage Gaps

[`lib/config/countries.ts`](lib/config/countries.ts) declares **5 countries** (GH, BD, VN, KE, BR) but only **GH and BD are `active: true`**. Even within active countries:

| Country | ILOSTAT employment | ILOSTAT earnings | WDI | WBES | Wittgenstein | Training providers |
|---|---|---|---|---|---|---|
| Ghana | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Real (NVTI, GIZ, MEST) |
| Bangladesh | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Real (BTEB, a2i, BRAC) |
| Vietnam | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ `[stub]` |
| Kenya | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ `[stub]` |
| Brazil | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ `[stub]` |

Activating VN/KE/BR requires expanding every fetcher's hardcoded country dict and replacing the `[stub]` provider strings in [`lib/config/countries.ts`](lib/config/countries.ts).

---

## Infrastructure / Architecture Gaps

### Database — nothing persists server-side

Current: everything lives in `localStorage` via Zustand stores:
- [`lib/profile-store.ts`](lib/profile-store.ts) (key `unmapped-profile`)
- [`lib/navigator-store.ts`](lib/navigator-store.ts) (key `unmapped-navigator`)
- [`lib/employer-store.ts`](lib/employer-store.ts) (key `unmapped-employer`)
- [`lib/ecosystem-store.ts`](lib/ecosystem-store.ts)
- [`lib/market-signal-store.ts`](lib/market-signal-store.ts)

Problems this causes:
- **Amara can't share her profile** across devices ([`lib/share-token.ts`](lib/share-token.ts) only encodes state in URL — no server holds it)
- **NGO caseworkers can't access profiles** they entered on one machine from another
- **Employers can't browse profiles** — there's no pool to query
- **Analytics are impossible** — aggregate policymaker data computed over static JSON, not real users

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
[Turso/libSQL](https://turso.tech/) is zero-infrastructure and gives real persistence with familiar SQL. Alternatively, [Upstash Redis](https://upstash.com/) for profile share tokens would solve the sharing problem immediately. [Supabase](https://supabase.com/) is also viable if you want auth + Postgres + Storage in one.

### Caching — every request re-reads all JSON files

[`lib/data-loaders/_read.ts`](lib/data-loaders/_read.ts) calls `fs.readFile()` on every invocation with no in-process cache. Every API request re-parses every JSON file it touches. With a future full-ESCO subset (10MB+), this compounds.

Quick fix: module-level `Map<string, {value, ts}>` cache with TTL — 5 lines added to [`lib/data-loaders/_read.ts`](lib/data-loaders/_read.ts).

### Skill mapper — no graceful degradation

[`lib/esco-mapper.ts:186-206`](lib/esco-mapper.ts) — fallback chain is: `ANTHROPIC_API_KEY` set → call `runClaude()` → throw on any error → return `upstream_error`. The keyword mock is only invoked when the API key is **absent**. There's no path where Claude fails at runtime and the mock picks up.

Better chain: Claude → (timeout/error) → local embeddings → keyword mock, with `confidence` declining at each step.

### Security surface

| Issue | Risk | Fix location |
|---|---|---|
| No input length limits | DoS via large text to skill mapper | Add `maxLength` validation in [`app/api/skills-map/route.ts`](app/api/skills-map/route.ts) + [`app/api/map-job-description/route.ts`](app/api/map-job-description/route.ts) |
| SHA-256 verification signature is deterministic (no salt) | Replay attack — same `(id, skill, date)` always identical | Add random nonce in [`lib/navigator-store.ts`](lib/navigator-store.ts) signature payload |
| No rate limiting on `/api/skills-map` | Claude API bill risk once `runClaude()` is wired | `next-rate-limit` or Upstash rate limiter wrapping [`app/api/skills-map/route.ts`](app/api/skills-map/route.ts) |
| `policymaker/validate-config` accepts JSON upload | Prototype pollution risk | JSON schema validation before key access in [`app/api/policymaker/validate-config/route.ts`](app/api/policymaker/validate-config/route.ts) |

---

## Quick Wins for MVP (by impact/effort)

### Tier 1 — High impact, low effort (< 2 hours each)

1. **Implement `runClaude()` in [`lib/esco-mapper.ts:179`](lib/esco-mapper.ts)** — the harness, retry logic (§7.1.2), and validation are written. The body is ~30 lines of [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) calls. This turns the single most visible gap into a strength.

2. **In-process JSON cache in [`lib/data-loaders/_read.ts`](lib/data-loaders/_read.ts)** — 5 lines, prevents re-reading 10MB of JSON on every request.

3. **Surface the Wittgenstein projection on the youth Opportunities page** — [`public/data/wittgenstein.json`](public/data/wittgenstein.json) is already in the `/api/match` response. Wire [`lib/wittgenstein-implications.ts`](lib/wittgenstein-implications.ts) into `OpportunityCard`.

4. **Add informality flag to opportunity cards** — fetch [ILO informality SDG 8.3.1](https://ilostat.ilo.org/topics/informality/) into a new `public/data/informality.json`, surface as "X% informal" badge.

### Tier 2 — High impact, moderate effort (2–6 hours each)

5. **Expand ESCO subset to 500–800 skills** — rerun [`scripts/data-prep/fetch_esco.py`](scripts/data-prep/fetch_esco.py) against the [real ESCO CSV release](https://esco.ec.europa.eu/en/use-esco/download) with broader ISCO group filters. Replace `S1.1.1`-style placeholder URIs with real ESCO concept URIs (and update [`lib/esco-mapper.ts`](lib/esco-mapper.ts), [`lib/jd-mapper.ts`](lib/jd-mapper.ts), [`lib/resilience.ts`](lib/resilience.ts) accordingly).

6. **Add IDF weighting to [`rankMatches()`](lib/skill-match.ts)** — weight each skill by inverse frequency across all occupations. 15 lines, measurably better ranking.

7. **Add ITU broadband + power access data** — two WDI indicators ([`IT.NET.BBND.P2`](https://data.worldbank.org/indicator/IT.NET.BBND.P2), [`EG.ELC.ACCS.ZS`](https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS)) plus an [ITU DataHub](https://datahub.itu.int/) pull turn the single-variable infrastructure model in [`lib/risk-calibration.ts`](lib/risk-calibration.ts) into a defensible composite.

8. **Implement minimal profile store API** — `POST /api/profiles` writing to [Turso](https://turso.tech/) or [Upstash](https://upstash.com/). New `app/api/profiles/route.ts` + `lib/db/profile-repository.ts`. Unblocks sharing flow and employer search.

### Tier 3 — Ambitious, weekend-worthy

9. **Skill adjacency graph** — parse the ESCO `broaderSkill`/`narrowerSkill` links (from the [CSV release](https://esco.ec.europa.eu/en/use-esco/download)) into a graph, run BFS from profile skills to target occupation. Replaces the hand-curated [`lib/resilience.ts`](lib/resilience.ts) `ADJACENT` map.

10. **Local embeddings for skill mapping** — [`@xenova/transformers`](https://huggingface.co/docs/transformers.js) with a multilingual model. Embed ESCO skill descriptions at build time, embed user text at runtime, top-k by cosine similarity. Works offline, no API key, handles informal language and non-English input. Slot in as fallback inside [`lib/esco-mapper.ts`](lib/esco-mapper.ts) `mapSkills()`.

11. **Gender-disaggregated risk and opportunity view** — extend [`scripts/data-prep/fetch_ilostat.py`](scripts/data-prep/fetch_ilostat.py) to pull `EMP_TEMP_SEX_ECO_NB_A` (with sex breakdown) + add [`fetch_wbl.py`](https://wbl.worldbank.org/) → toggle in policymaker dashboard.

---

## What Doesn't Exist at All (and Where It Would Go)

| Feature | Brief Relevance | Where to Build |
|---|---|---|
| Real profile persistence | Sharing, employer search, NGO caseload | New `lib/db/` + `app/api/profiles/` (replaces [`lib/profile-store.ts`](lib/profile-store.ts) for canonical state) |
| Verifiable credentials (W3C VC) | True cross-border portability | New `lib/vc-builder.ts` wrapping [`lib/profile-v1-builder.ts`](lib/profile-v1-builder.ts) |
| Pathway engine ("3 skills away from X") | Honest grounded matching | New `lib/pathway.ts` using ESCO graph |
| Multi-language UI | Country-agnostic requirement | New `messages/tw.json`, `messages/bn.json` — scaffold exists in [`lib/i18n.ts`](lib/i18n.ts) |
| Employer profile pool + search | Employer flow completion | [`lib/employer-store.ts`](lib/employer-store.ts) wired to server-side storage + new search API |
| Real-time ILOSTAT/WDI refresh | "Real data" judging criterion | Replace static JSON with a scheduled fetch in a cron route (see [Stub Files table](#stub-files-vs-real-sources)) |
| STEP data integration | "Rare direct LMIC skill evidence" | New `scripts/data-prep/fetch_step.py` + `public/data/step.json` + `lib/data-loaders/step.ts` |
| Informality sector model | LMIC context requirement | New field in [`lib/config/countries.ts`](lib/config/countries.ts) `CountryConfig` + ILO informality loader |
| Demand-side heat index | "Honest matching" requirement | Combine WBES hiring difficulty + ILO growth trends in new `lib/demand-heat.ts` |
| Gender equity overlay | Brief appendix emphasis | ILO gender stats + WBL 2024 loader + policymaker toggle |
