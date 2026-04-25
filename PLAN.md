# Unmapped — 10h Plan

Vertical split by module. Each squad ships its priority module top-to-bottom.

- **Squad 1 — Module 1: Skills Signal Engine** → Peter (backend) + Lennard (frontend)
- **Squad 2 — Module 2: AI Readiness & Risk Lens** → Akshat (backend) + Damian (frontend + UX + pitch)

Stack: FastAPI + Next.js, monorepo, no auth, in-memory data, no hardcoding (everything country-varying lives in `AppConfig`).

---

## Squad 1 — Module 1: Skills Signal Engine

> Informal text or job description → ESCO skills → ISCO-08 code, with a visible mapping breadcrumb. Outputs portable JSON-LD profile. NGOs verify skills.
>
> Covers: Youth flow steps 1–3 + 5, Employer flow (all), NGO flow.

**Peter — backend** (already deep in this)
- ESCO/ISCO subset (~80–120 skills, ~20 codes for LMIC informal work)
- `POST /map { text, side }` → `{ esco_skills, isco_code, breadcrumb }` — **same endpoint serves Youth and Employer (this is the bi-directional engine)**
- `POST /candidates` — ESCO intersection within same ISCO cluster
- `POST /verify` — NGO marks a skill verified
- `GET /export/{profile_id}` — JSON-LD `unmapped.profile/v1`

**Lennard — frontend**
- Youth page: capture form → `MappingBreadcrumb` → skill chips → export button
- Employer page: dual input (filter dropdowns + JD textarea) → same `MappingBreadcrumb` → Talent Cards
- NGO page: profile list → "Verify skill" button (stamps render on Youth + Employer cards)

---

## Squad 2 — Module 2: AI Readiness & Risk Lens

> Given a profile, compute `Final_Risk = (Global_Automation_Score × Connectivity_Index) + (1 − Skill_Durability)` per task. Suggest adjacent durable skills. Show Wittgenstein 2025–2035 trends.
>
> Covers: Youth flow step 4, Policymaker flow (all).

**Akshat — backend** (taking over; partial collab with Peter on shared ISCO/ESCO data)
- Frey-Osborne automation scores by ISCO, ITU connectivity by country, skill durability table
- `POST /risk { profile_id, country }` → `{ final_risk, per_task[], explanation }`
- `POST /recommend { profile_id }` → adjacent durable skills
- `GET /policy/divergence` — supply vs demand by ISCO cluster (consumes Peter's mapping output)
- `GET /policy/projections` — Wittgenstein 2025–2035
- `GET /config` + `AppConfig` schema — country-swap source of truth

**Damian — frontend + UX + pitch**
- `RiskLens` component (mounts inside Lennard's Youth page): donut + per-task breakdown + constructive copy
- Recommendation cards ("durable skills to add")
- Policymaker dashboard: heatmap + Wittgenstein chart + AppConfig file upload
- `/about/limits` page
- All UX copy across both squads (tooltips, empty states, risk explanations)
- Pitch deck and demo script — Lennard delivers, both rehearse from h7

---

## Lock at hour 0 (kills all blocking)

1. `API.md` — endpoint shapes from both squads, agreed before anyone writes UI
2. `AppConfig` schema — Akshat drafts, both squads use it from line 1
3. `backend/app/data/fixtures.json` — Damian commits 8 demo profiles + 4 JDs so frontend builds against mocks immediately

**Three coordination seams** (everything else is independent):
- `MappingBreadcrumb` — Lennard builds, used on Youth + Employer
- `RiskLens` — Damian builds, Lennard mounts a slot for it on Youth page
- `/policy/divergence` — Akshat builds, depends on Peter's mapping output (the collab point)

---

## Milestones

| | Squad 1 (Peter + Lennard) | Squad 2 (Akshat + Damian) |
|---|---|---|
| **h3** | Youth: paste text → mapped skills + ISCO + breadcrumb on screen | `/risk` returns Final_Risk + per-task breakdown (Postman-testable) |
| **h5** | Employer: paste JD → mapped → Talent Cards rendered | RiskLens visualized on Youth page; `/recommend` stub returning |
| **h7** | NGO verify stamps appear. JSON-LD export downloads. | Recommendation cards live. Policymaker Wittgenstein chart. |
| **h9** | Ghana → Vietnam live swap via AppConfig only | 3× pitch dry-runs + backup demo video recorded |
| h10 | Submit | Submit |

## Non-goals

No auth, no DB, no live data fetch (cached subsets only), no real translations, no mobile polish.
