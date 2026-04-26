# Locale Decision — Twi-in-Latin

**Decision date:** recorded at project kickoff (spec §3 hour-4 deadline pre-empted — locked before UI work begins).

## Choice

The non-English entry flow ships in **Twi (Akan) written in Latin script** with Ghana-specific credential labels (SHS, BECE, WASSCE). Bangla is **not** shipped this session.

## Rationale

- No fluent Bangla reviewer is available to the team. Spec §3 prohibits shipping Google-Translate-only strings.
- Script-rendering risk is eliminated by staying in Latin script (no Noto Sans Bengali subsetting, no font-fallback glitches in print or on low-end Android).
- Twi-in-Latin still satisfies the §8 localizability claim: the entry flow visibly re-renders in a non-English locale and uses country-specific education taxonomy (SHS vs. generic "high school").
- Bundle target stays at **< 150 KB gzipped** (no Bangla font allowance needed).
- All five entry-flow questions are translated; see `messages/tw-Latn.json`.

## Override clause

This decision is **reversible only by a fluent Twi or Bangla speaker on the team** who has personally reviewed every string. It cannot be reopened by "we'll just run it through a translator again." Reopening means re-reviewing every string in `messages/*.json` end-to-end before the demo recording at spec §13 step 14.

## Known limitations

- The `messages/tw-Latn.json` strings are a best-effort draft. Before the demo recording, a fluent Twi speaker must review the file. A reviewer note is committed at the top of the file.
- Bangladesh config is still **active** in `lib/config/countries.ts` — the BD view uses English labels this session. The country-switch demo (§11 timestamp 0:40–0:52) still works: education taxonomy changes (SSC/HSC vs. SHS/WASSCE), opportunity emphasis changes, numbers change. The "language of the user interface" differentiator is demonstrated via the GH → Twi-in-Latin switch, not via BD.
