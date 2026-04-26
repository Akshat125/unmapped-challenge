# SMS Channel — Setup & Demo

A text-only intake path for users without reliable internet. Same
`/api/skills-map` + `/api/match` pipeline as the web app; only the
transport is different.

## Architecture

```
 ┌──────────────┐   POST    ┌──────────────────────────┐
 │ User's phone │ ────────▶ │ Africa's Talking sandbox │
 │  (SMS, GH #) │           └──────────────┬───────────┘
 └──────────────┘                          │  webhook (form POST)
                                           ▼
                            ┌─────────────────────────────┐
                            │  /api/sms/incoming          │
                            │  → lib/sms-state-machine.ts │
                            │  → mapSkills + /api/match   │
                            │  → lib/sms-provider.ts      │
                            └──────────────┬──────────────┘
                                           │ REST
                                           ▼
                            ┌─────────────────────────────┐
                            │ AT outbound messaging       │
                            └──────────────┬──────────────┘
                                           ▼
                                    User receives 4 SMS:
                                    1. Skill profile
                                    2. Top 3 jobs
                                    3. Skill gap for best match
                                    4. AI exposure + link
```

For local development and the browser-based demo we also ship
`/api/sms/local` + `/sms-demo`, which bypass AT entirely and render the
same replies inline. Useful when AT's sandbox simulator is unavailable
(it 503s occasionally) or when judges want to try the flow without an
AT account.

## Files

- `lib/sms-state-machine.ts` — pure 7-step flow, provider-agnostic
- `lib/sms-format.ts` — profile/match/risk → SMS-sized strings
- `lib/sms-session-store.ts` — in-memory `Map<phone, session>` (see
  "Production notes" below)
- `lib/sms-provider.ts` — AT REST client, with a no-op fallback
- `app/api/sms/incoming/route.ts` — AT inbound webhook
- `app/api/sms/local/route.ts` — browser-simulator companion
- `app/sms-demo/page.tsx` — iPhone-style local simulator UI
- `scripts/smoke-sms.ts` — headless state-machine walk-through

## Quick start

### Option A — local simulator only (no AT account required)

```bash
npm install
npm run dev
open http://localhost:3000/sms-demo
```

The page auto-starts a session against `+233700000001` and walks through
all seven questions. Everything the production webhook does runs here
too — Claude skill-mapping, /api/match, country-aware risk calibration,
Ghana vs Bangladesh data.

### Option B — real SMS through Africa's Talking sandbox

1. Sign up at https://account.africastalking.com/. Stay in the default
   **sandbox** app. Generate an API key under Settings → API Key.

2. Add to `.env.local`:

   ```
   AT_USERNAME=sandbox
   AT_API_KEY=...paste from dashboard...
   # Optional — AT assigns a default shortcode, set this only if you
   # have reserved a specific one.
   AT_SHORTCODE=
   ```

3. Expose your dev server:

   ```bash
   npm install -g ngrok           # one-time
   npm run dev &                   # in one terminal
   ngrok http 3000                 # copy the HTTPS URL it prints
   ```

4. In AT dashboard → SMS → SMS Callback URLs → set the inbound callback
   to:

   ```
   https://<your-ngrok-subdomain>.ngrok.io/api/sms/incoming
   ```

5. Open https://simulator.africastalking.com/ (or if it's down, use
   Option A). Log in with any Ghana-format phone number, e.g.
   `+233244123456`. Text `hi` — the webhook answers in the simulator.

## Pitch-demo plan

**Primary path (recommended):** screen-record `/sms-demo` running
locally. Zero network risk, reliable, visually identical to an iPhone
messages thread. Voiceover: *"This is Amara's phone. Same skills
pipeline as the dashboard, delivered over SMS."*

**Secondary path:** live AT sandbox simulator in a separate browser
tab. Use if you want the "this is real SMS, not a mockup" moment. Keep
the local simulator open as a fallback — when AT's sandbox is down,
demo looks identical.

**What to say about production:** one slide at the end.

> Production deployment swaps AT sandbox for a registered shortcode
> (~$3/mo in Ghana via AT, ~$5/mo in Bangladesh via Infobip). Session
> state moves from in-memory to Redis. Webhook signature validation
> enabled. All other code unchanged — the state machine, formatters,
> and /api/match route are transport-agnostic.

## Tests

```bash
npm run smoke:sms   # walks the state machine without AT; asserts final step
```

## Production notes (not blocking for demo submission)

1. **Session storage:** `lib/sms-session-store.ts` is an in-memory
   `Map`. This only works because `next dev` and a long-running Node
   server keep one process alive. Vercel serverless deployments reset
   the Map per request, so production needs Redis (Vercel KV, Upstash,
   Redis Labs) behind the same get/set/delete interface.

2. **Webhook auth:** AT signs inbound requests with a configurable
   header. We skip validation in the prototype. Production should
   verify the signature and optionally pin source IPs.

3. **Rate limiting:** one active session per phone is implicit via the
   `Map` key, but production should also cap total messages per hour
   per phone.

4. **Localization:** messages are English-only. GH and BD both default
   to English per `lib/config/countries.ts`. Extending to Twi or Bangla
   means a `messages-sms/<locale>.ts` file keyed by session step.

5. **Number ownership:** production requires a registered GH or BD
   shortcode/long-code. AT handles GH natively; Bangladesh goes
   through Infobip or GP's direct SMPP link.
