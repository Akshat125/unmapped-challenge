# Risk Register

Internal document — not shipped to judges. Forces the team to plan for failure modes rather than improvise at hour 22. From build-spec §15.

| #  | Risk | Trigger | Fallback | Decision deadline |
|----|------|---------|----------|-------------------|
| 1  | Non-English UI strings | No verified translator on team | English only; country distinction is taxonomy + numbers, not language | Resolved — English-only single bundle |
| 2  | Wittgenstein implication non-deterministic | LLM-generated sentences vary between runs | Template-only generation per §7.2.2 | Already enforced: `lib/wittgenstein-implications.ts` uses no LLM |
| 3  | ILOSTAT API rate limits during data prep | API throttles | Pre-cached CSV / seed values committed to repo; replace with live fetch when network stable | Hour 2 — **resolved**: `scripts/data-prep/` uses committed seed data primary-path |
| 4  | Bangladesh narrative claim wrong | Memorized stat doesn't match loaded data | Rewrite narrative from actual loaded numbers (`npm run smoke` reads them) | Hour 18 (post-data-prep) |
| 5  | Service worker breaks late builds | Caching subtly wrong | Ship without offline mode; surface localStorage cache; update §10 acceptance | Hour 22 |
| 6  | Claude API misfires during recording | Validation rejects >50% of codes | §7.1.2 fallback: retry with stricter prompt, then flag profile with re-prompt | Always live once `ANTHROPIC_API_KEY` is set |
| 7  | O\*NET SOC-to-ISCO crosswalk yields too many misses | >25% miss rate on full fetch | Reduce demo subset to occupations with clean joins; document in `/about/limits` | Hour 6 — current demo subset has 100% match (seed); expect drop to ~85% on full fetch |
| 8  | Non-Latin font rendering | Bundle exceeds 200KB | English-only build eliminates this risk | Not applicable — English only |
| 9  | Demo video re-take fails | Bug breaks happy path at hour 20 | Use scripted fallback path: skip country switch, narrate it over a static screenshot | Hour 20 |

## Notes

- **Risk #1 resolved.** English-only single bundle. Country differentiation is education taxonomy, currency, training providers, and econometric numbers — not UI language.
- **Risk #3 pre-empted.** Every data-prep fetcher reads from committed seed data as the primary path and documents the live-fetch TODO in a module docstring. `scripts/data-prep/cache/` is reserved for future offline-capable CSV downloads.
- **Risk #7 currently at 100% match** because the committed crosswalk CSV covers only the occupations in the demo subset. When the team swaps in the full published BLS/ILO crosswalk, expect the natural ~15% miss rate; the `build_occupation_subset.py` orchestrator already logs every miss to `public/data/crosswalk_misses.json` and reports the match rate on stdout.
