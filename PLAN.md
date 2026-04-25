# Unmapped — 10h Hackathon Plan

**Stack**: FastAPI (`backend/`) + Next.js (`frontend/`), monorepo, no auth, in-memory data.
**Scope**: Modules 1 + 2 deep. All 4 personas demoable. Country-swap (Ghana → Vietnam) via `AppConfig` only — zero hardcoding.

## Ownership

| Person | Owns end-to-end | Swing |
|---|---|---|
| **Akshat** | Backend + AI engine: `/map`, `/risk`, `/candidates`, `/verify`, `/export`, `/policy/divergence`, `/config`, `AppConfig`, ESCO/ISCO/Frey-Osborne/ITU data subsets | — |
| **Peter** | Frontend shell + shared components (`MappingBreadcrumb`, `TalentCard`, `SkillChip`) + **Employer page** | Backend swing for `/verify` + `/export` if Akshat is behind by hour 4 |
| **Lennard** | **Youth page** (form → mapping → Risk Lens → export) + **Policymaker dashboard** + pitch delivery | — |
| **Damian** | UX copy (tooltips, microcopy, constructive risk text, `/about/limits`) + demo fixtures (8 profiles, 4 JDs) + **NGO page** + pitch deck | — |

## Milestones

| When | Ship | Demo-able |
|---|---|---|
| **M1 — h3** | Akshat: `/map`. Lennard: Youth form + breadcrumb. Peter: Employer scaffold + shared components. Damian: fixtures committed. | Paste informal text → see ESCO skills + ISCO code with breadcrumb |
| **M2 — h5** | Akshat: `/risk` + `/candidates`. Peter: Employer wired to bi-dir engine + Talent Cards. Lennard: Risk Lens UI. | Youth sees risk; Employer pastes JD → sees matching candidates |
| **M3 — h7** | Akshat: `/verify` + `/export` JSON-LD + `/policy/divergence` + `/config` reload. Damian: NGO verify flow + `/about/limits`. Lennard: Policymaker dashboard. | All 4 personas work; live Ghana → Vietnam config swap |
| **M4 — h9** | Bug bash. Lennard + Damian: 3x pitch dry-runs + backup video. Peter + Akshat: polish. | Demo-ready |
| **h9–10** | README, Loom, submit. | — |

## Lock at hour 0 (prevents blocking)

- **`API.md`** with shapes for all 7 endpoints — committed before anyone writes UI.
- **`backend/app/data/fixtures.json`** — 8 profiles + 4 JDs from Damian, so frontend builds against mocks while `/map` is in progress.
- **`AppConfig` schema** — every country-varying value lives here. Reviewer rule: "is this string in `AppConfig`?"

## Non-goals

No auth, no DB, no live data fetch (use cached subsets), no NGO login, no real translations (one second-language label sample only), no mobile polish beyond Tailwind defaults.
