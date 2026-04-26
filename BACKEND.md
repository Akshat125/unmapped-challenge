# Backend Roadmap — Peter & Akshat

Two squads. One hard interlink: Peter's `/map` writes a profile to the in-memory store. Akshat's `/risk` reads it by `profile_id`. **The profile object schema below is the contract. Agree on it at hour 0 before writing any logic.**

---

## Shared Setup — hour 0 (both)

**T0-1: Repo scaffold**
```
backend/
  app/
    main.py          # FastAPI app, CORS, routers
    config.py        # AppConfig dataclass
    store.py         # in-memory profile store (plain dict, good enough)
    data/            # all static JSON datasets go here
    routers/
      mapping.py     # Module 1 — Peter
      risk.py        # Module 2 — Akshat
      policy.py      # Module 2 — Akshat
      config.py      # GET /config — Akshat
    engine/
      mapping.py     # M1 logic — Peter
      risk.py        # M2 logic — Akshat
```

**T0-2: AppConfig schema** — Akshat drafts, Peter reviews, both use from line 1.
Everything country-varying lives here. Never hardcode these.
```python
@dataclass
class AppConfig:
    country: str                    # "GH" | "VN"
    country_label: str              # "Ghana" | "Vietnam"
    infra_bias: float               # multiplier on Connectivity_Index (0.0–1.0)
    automation_calibration: float   # regional modifier on Frey-Osborne score
    wage_index_source: str          # path to relevant wage data file
    opportunity_types: list[str]    # ["formal", "self-employment", "gig", "training"]
    ui_language: str                # "en" | "fr" (maps to strings file)
```
Ghana config ships with the repo. Vietnam config is the live-swap demo at h9.

**T0-3: In-memory profile store** (`store.py`) — Peter writes it, Akshat imports it.
```python
# store.py
profiles: dict[str, Profile] = {}   # keyed by uuid profile_id
jd_mappings: dict[str, JDMapping] = {}  # keyed by uuid jd_id
```

**T0-4: Profile object schema** — the hard contract between squads.
```python
@dataclass
class EscoSkill:
    id: str              # e.g. "S4.7.1"
    label: str           # e.g. "smartphone hardware repair"
    verified: bool       # set by NGO via /verify
    durability: float    # filled by Akshat's risk engine from ILO task-content data

@dataclass
class Profile:
    profile_id: str
    side: str            # "supply" | "demand"
    raw_text: str
    esco_skills: list[EscoSkill]
    isco_code: str       # e.g. "7422"
    isco_label: str      # e.g. "Electronics Mechanics and Servicers"
    breadcrumb: list[dict]   # [{"fragment": "fix hardware", "esco": "smartphone hardware repair", "isco": "7422"}]
    country: str         # from AppConfig at request time
```

---

## Module 1 — Skills Signal Engine (Peter)

### Functional requirements (from user stories + brief)

| # | Requirement | Source |
|---|---|---|
| FR1 | Accept informal natural-language text OR structured ISCO dropdown → extract tasks → map to ESCO skills | Youth flow step 1–2, Employer flow option A+B |
| FR2 | Map ESCO skills → parent ISCO-08 code | Both flows, BI-DIRECTIONAL (same endpoint) |
| FR3 | Return mapping breadcrumb: input fragment → ESCO skill → ISCO code (visible trust layer) | Employer transparency requirement |
| FR4 | Store profile in-memory with stable `profile_id` | Prerequisite for `/risk` (Akshat's module) |
| FR5 | Given a mapped JD, find candidate profiles: ESCO skill intersection within same ISCO-08 cluster | Employer flow step 3 |
| FR6 | NGO marks specific ESCO skills as `verified: true` | NGO flow step 2 |
| FR7 | Export profile as JSON-LD `unmapped.profile/v1` | Youth flow step 5, portability requirement |

### Datasets

| Dataset | What you need | File |
|---|---|---|
| ESCO Skills Taxonomy (EU) | Curate ~100 skills relevant to LMIC informal sectors (mobile repair, retail trade, agriculture, domestic work, construction). Download from `https://esco.ec.europa.eu/en/use-esco/download`. Take `skills_en.csv`, filter by `skillType=skill/competence`. | `data/esco_subset.json` |
| ILO ISCO-08 | ~20 major/submajor group codes covering informal economy. You need: code, label, parent group, description. | `data/isco_codes.json` |
| ESCO → ISCO mapping | ESCO provides `occupations_en.csv` which links occupation URIs → ISCO-08 codes. Use this to build the skill→ISCO lookup. | `data/esco_isco_map.json` |
| O*NET (supplementary) | Task descriptions per occupation — useful for improving text matching if ESCO labels are too abstract. Map via ISCO crosswalk. | `data/onet_tasks_subset.json` (optional, skip if time-pressured) |

**Curated ISCO codes to target** (covers Amara-type profiles):
- 7422 Electronics Mechanics and Servicers
- 7421 Electronics Fitters
- 5221 Shop Salespersons
- 6110 Subsistence Crop Farmers
- 3513 Computer Network and Systems Technicians
- 9321 Hand Packers
- 4131 Typists and Word Processing Operators
- 5141 Hairdressers, Barbers (example informal service)
- 7512 Bakers and Pastry Cooks
- 2352 Special Needs Teachers (for NGO-adjacent skills)

### Tickets

**Data ingestion**
- `M1-D1` Download ESCO `skills_en.csv` + `occupations_en.csv`. Filter to ~100 skills across the ISCO codes above. Serialize as `data/esco_subset.json`: `[{id, label, description, isco_code, isco_label}]`
- `M1-D2` Build `data/isco_codes.json`: `[{code, label, group, description}]` for the ~20 codes above
- `M1-D3` Commit `data/fixtures.json`: 8 youth profiles (raw text strings covering diverse LMIC informal work) + 4 employer JDs. Damian provides the text; Peter formats the JSON.

**Core logic** (`engine/mapping.py`)
- `M1-L1` **Text → ESCO matcher.** Use `sentence-transformers` (model: `all-MiniLM-L6-v2`, fast, small). Embed all ESCO skill labels at startup. For incoming text: chunk into phrases, embed, cosine-sim against ESCO embeddings, return top-k matches above threshold. *Fallback if too slow*: TF-IDF keyword overlap against ESCO labels+descriptions.
- `M1-L2` **ESCO → ISCO mapper.** Lookup from `esco_isco_map.json`. If multiple ISCO codes emerge from matched skills, pick the plurality. Return the winning ISCO code + label.
- `M1-L3` **Breadcrumb builder.** For each matched ESCO skill: record which input phrase triggered it. Return `[{fragment, esco_label, isco_code, isco_label}]`.
- `M1-L4` **Candidate matcher.** Given a JD's `JDMapping.esco_skills + isco_code`, scan `store.profiles` (side=`"supply"`) for profiles sharing the same `isco_code`. Score by count of overlapping ESCO skill ids. Sort descending. Return top 10 with `verified` skills surfaced first.
- `M1-L5` **JSON-LD serializer.** Map `Profile` to `unmapped.profile/v1` context. Minimum context:
```json
{
  "@context": "https://unmapped.io/profile/v1",
  "@type": "SkillsProfile",
  "id": "...",
  "iscoCode": "7422",
  "escoSkills": [...],
  "verifiedBy": [...],
  "country": "GH",
  "exportedAt": "..."
}
```

**API endpoints** (`routers/mapping.py`)
- `M1-A1` `POST /map` → calls M1-L1 + M1-L2 + M1-L3, writes to `store.profiles` (if `side=supply`) or `store.jd_mappings` (if `side=demand`), returns `{profile_id, esco_skills, isco_code, isco_label, breadcrumb}`
- `M1-A2` `POST /candidates {jd_id}` → calls M1-L4, returns ranked candidate list
- `M1-A3` `POST /verify {profile_id, esco_skill_id}` → sets `skill.verified = True` in store
- `M1-A4` `GET /export/{profile_id}` → calls M1-L5, returns JSON-LD with `Content-Disposition: attachment`

---

## Module 2 — AI Readiness & Risk Lens (Akshat)

### Functional requirements (from user stories + brief)

| # | Requirement | Source |
|---|---|---|
| FR1 | Per task/skill: compute automation risk using Frey-Osborne, calibrated for LMIC infra via ITU | Youth flow step 4, risk formula mandate |
| FR2 | Compute `Skill_Durability` per ESCO skill using ILO task-content indices (routine/non-routine axis) | Risk formula: `1 - Skill_Durability` term |
| FR3 | Apply `infra_bias` from AppConfig — risk in Kampala ≠ Kuala Lumpur | Country-agnostic requirement |
| FR4 | Generate constructive explanation strings, not raw numbers | Youth flow: user must understand output |
| FR5 | Recommend adjacent durable skills from same ISCO cluster with low automation risk | Youth flow step 4 / NGO coaching step 3 |
| FR6 | Policymaker: skill divergence heatmap (supply ESCO profile frequencies vs demand JD frequencies, by ISCO cluster) | Policymaker flow step 2 — **depends on Peter's profile store** |
| FR7 | Policymaker: Wittgenstein 2025–2035 education projections for selected country | Policymaker flow step 3 |
| FR8 | Serve active AppConfig as JSON so frontend can adapt without hardcoding | Country-agnostic requirement |

### Datasets

| Dataset | What you need | File |
|---|---|---|
| Frey & Osborne (2013) | Appendix Table with 702 SOC occupation automation probabilities. **Map SOC → ISCO-08** using BLS/ILO crosswalk. For our ~20 ISCO codes, get the median F-O score. | `data/frey_osborne.json` |
| ILO Future of Work task-content indices | Routine cognitive / routine manual / non-routine cognitive / non-routine manual scores by ISCO-08. Download from ILO stat or the "Future of Work" dataset tables. Non-routine cognitive = durable. Routine manual = fragile. | `data/ilo_task_content.json` |
| ITU Digital Development | Mobile broadband + internet penetration by country. 2022–2023 figures. Need: `country_iso2`, `mobile_broadband_per_100`, `internet_users_pct`. For Ghana + Vietnam + 3–4 other LMICs. | `data/itu_connectivity.json` |
| Wittgenstein Centre | Education level projections by country + sex + age group + year (2025–2035). Download from `https://www.wittgensteincentre.org/dataexplorer`. Export for Ghana + Vietnam. | `data/wittgenstein.json` |
| ILO ILOSTAT | Median wages by sector + country for the policymaker signals. Pick Ghana + Vietnam, 3–4 sectors each. | `data/ilostat_wages.json` |

### Risk formula

```
Final_Risk(skill) = (Frey_Osborne_Score(isco_code) * AppConfig.automation_calibration
                     * Connectivity_Index(country))
                  + (1 - Skill_Durability(esco_skill_id))

Connectivity_Index = itu_mobile_broadband_per_100 / 100 * AppConfig.infra_bias
Skill_Durability   = normalized non-routine cognitive score from ILO task-content
```

The `automation_calibration` in AppConfig lets a policymaker dial LMIC-specific exposure (e.g. Ghana gets 0.7 because digital infrastructure makes automation penetration slower).

### Tickets

**Data ingestion**
- `M2-D1` Download Frey-Osborne appendix → build SOC→ISCO crosswalk → produce `data/frey_osborne.json`: `[{isco_code, automation_probability}]`
- `M2-D2` Extract ILO task-content indices → `data/ilo_task_content.json`: `[{isco_code, routine_cognitive, routine_manual, nonroutine_cognitive, nonroutine_manual}]`
- `M2-D3` Extract ITU data for demo countries → `data/itu_connectivity.json`: `[{country_iso2, mobile_broadband_per_100, internet_pct}]`
- `M2-D4` Extract Wittgenstein for Ghana + Vietnam → `data/wittgenstein.json`: `[{country, year, edu_level, value}]`
- `M2-D5` Extract ILOSTAT wages → `data/ilostat_wages.json`: `[{country, sector, isco_group, median_wage_usd}]`

**Core logic** (`engine/risk.py`)
- `M2-L1` **Risk calculator.** Loads `frey_osborne.json` + `ilo_task_content.json` + `itu_connectivity.json` at startup. For a given profile (from store), iterates `esco_skills`, looks up parent `isco_code`, runs formula, returns `{final_risk, per_skill: [{esco_id, label, automation_score, durability, task_risk}]}`.
- `M2-L2` **Explanation generator.** Maps `final_risk` ranges to constructive strings sourced from AppConfig string table (not hardcoded). E.g. `risk > 0.7` → "Hardware assembly tasks are highly automatable in connected markets — but your diagnostic and customer-service skills are durable."
- `M2-L3` **Recommendation engine.** Given `profile.isco_code`, scan `esco_subset.json` for skills in same ISCO cluster NOT in profile. Sort by `automation_probability` ascending (most durable first). Return top 5.
- `M2-L4` **Divergence calculator.** Count ESCO skill frequency in `store.profiles` (supply side) vs `store.jd_mappings` (demand side), grouped by ISCO code. Return `{isco_code, supply_count, demand_count, gap}` sorted by gap descending. **This is the INTERLINK — reads Peter's store.**
- `M2-L5` **Wittgenstein reader.** Filter `wittgenstein.json` by `country` + `year >= 2025`. Return grouped by year.

**API endpoints** (`routers/risk.py`, `routers/policy.py`)
- `M2-A1` `POST /risk {profile_id, country}` → reads profile from store (Peter's data), calls M2-L1 + M2-L2
- `M2-A2` `POST /recommend {profile_id}` → calls M2-L3
- `M2-A3` `GET /policy/divergence?country=GH` → calls M2-L4 (reads Peter's store)
- `M2-A4` `GET /policy/projections?country=GH` → calls M2-L5
- `M2-A5` `GET /config` → returns active `AppConfig` as JSON

---

## Interlinks (talk before coding these)

| # | What | Who writes | Who reads | When to sync |
|---|---|---|---|---|
| **IL-1** | `Profile` + `EscoSkill` schema | Both agree at h0 | Peter writes to store, Akshat reads from store | Hour 0 — cannot start without this |
| **IL-2** | `store.py` module | Peter owns | Akshat imports `from app.store import profiles` | Hour 1 — Peter ships it, Akshat imports |
| **IL-3** | `esco_subset.json` + `esco_isco_map.json` | Peter (M1-D1) | Akshat needs `isco_code` per skill for risk lookup | Hour 1 — Peter commits data, Akshat reads it |
| **IL-4** | `/policy/divergence` | Akshat | Reads `store.profiles` + `store.jd_mappings` from Peter's router | Hour 6 — can only build after Peter's `/map` is writing correctly to store |

---

## Sequencing (rough)

```
Hour 0-1:  T0-1 (scaffold) → T0-2 (AppConfig) → T0-3 (store) → T0-4 (Profile schema)
            Both pair briefly on IL-1 and IL-2. Then diverge.

Hour 1-3:  Peter: M1-D1, M1-D2, M1-D3, M1-L1, M1-L2, M1-L3, M1-A1  ← M1 milestone
           Akshat: M2-D1, M2-D2, M2-D3, M2-L1 (can use fixture profile_id to test)

Hour 3-5:  Peter: M1-L4, M1-A2 (candidates), M1-A3 (verify)
           Akshat: M2-D4, M2-D5, M2-L2 (explanation), M2-A1, M2-A2  ← M2 milestone

Hour 5-7:  Peter: M1-L5, M1-A4 (export), polish /map edge cases
           Akshat: M2-L4 (IL-4 sync with Peter), M2-L5, M2-A3, M2-A4, M2-A5

Hour 7+:   Both: integration bug bash, AppConfig country-swap test, fixture data QA
```

---

## Non-goals (backend)
- No database, no auth, no rate limiting
- No live API calls to ILOSTAT / ESCO — all data is pre-downloaded static JSON
- No multilingual NLP — skill labels are English; language swap is a UI string-file concern
- No O*NET ingestion unless M1-L1 matching quality is visibly bad by hour 3
