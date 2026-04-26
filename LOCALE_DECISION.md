# Locale Decision — BOL · GHA · VNM

**Decision date:** recorded at project kickoff (spec §3 hour-4 deadline pre-empted — locked before UI work begins).
**Last updated:** when the country roster narrowed to BOL/GHA/VNM and the runtime locales switched to `en` / `es` / `vi`.

## Choice

| Country | ISO-3 code | UI locale | Bundle file | Why this locale |
| ------- | ---------- | --------- | ------------ | --------------- |
| Ghana | `GHA` | English (`en`) | `messages/en.json` | Co-official language; matches existing SHS / BECE / WASSCE credential labels and avoids re-introducing untested Twi strings into the demo. |
| Bolivia | `BOL` | Spanish (`es`) | `messages/es.json` | Spanish is the most widely shared official language in Bolivia; the entry flow visibly switches to Spanish on country change. |
| Vietnam | `VNM` | Vietnamese (`vi`) | `messages/vi.json` | Vietnamese is the sole official language; Latin-script with diacritics, no extra font subsetting required. |

Country selection in the UI is rendered in each country's **native name** (`Ghana`, `Bolivia`, `Việt Nam`), per spec §3 "one country in English, the others in their native language."

The previously shipped **Twi-in-Latin** bundle (`messages/tw-Latn.json`) is **retired from runtime use**. The file is still in the repo for history but is no longer referenced from `i18n.ts` / `lib/i18n.ts` and is not selectable from the UI.

## Rationale

- All three countries have a single dominant official language with a stable Latin or Latin-extended orthography, so the bundle target stays at **< 150 KB gzipped** with no extra font fallback work.
- Spec §3's "one country in English, the rest in native language" requirement is satisfied: GHA → English, BOL → Spanish, VNM → Vietnamese.
- Spec §8's "the UI visibly re-renders in a non-English locale and uses country-specific taxonomy" requirement is satisfied twice: BOL switches to Spanish education levels (Secundaria / Bachillerato / Técnico Superior / Universitario) and BOB currency labels; VNM switches to Vietnamese education levels (THCS / THPT / Trung cấp / Cao đẳng / Đại học) and VND currency labels.
- No Google-Translate-only strings are shipped without a reviewer note: every non-English bundle (`messages/es.json`, `messages/vi.json`) carries a `_note` reviewer disclaimer at the top, and the demo script flags the strings as "best-effort drafts pending native-speaker review."

## Override clause

This decision is **reversible only by a fluent Spanish or Vietnamese speaker on the team** who has personally reviewed every string in the corresponding bundle. It cannot be reopened by "we'll just run it through a translator again." Reopening means re-reviewing every string in `messages/<locale>.json` end-to-end before the demo recording at spec §13 step 14.

## Known limitations

- `messages/es.json` and `messages/vi.json` are **best-effort drafts**. Before the demo recording, a native Spanish (Bolivian-aware) and a native Vietnamese speaker must review the corresponding files. A reviewer note is committed at the top of each file.
- The retired `messages/tw-Latn.json` is **not** wired into the runtime `BUNDLES` map in `lib/i18n.ts`. If a fluent Twi speaker later joins the team, the file is the starting point — but the country-switcher would also need to surface a Twi option for Ghana, which is intentionally not exposed today.
- BD / KE / BR are **removed** from `lib/config/countries.ts`. Old persisted profiles holding `country: "GH"` / `"BD"` / `"VN"` / `"KE"` / `"BR"` are migrated on hydrate by `migrateCountryCode` in `lib/profile-store.ts` (`GH→GHA`, `VN→VNM`, anything else → `GHA`).
