# Decisions log

## 2026-09-11 — Initial build (Commits 1-5)

**Stack choices**
- Next.js App Router, TypeScript, Tailwind — scaffolded with `create-next-app`.
- Supabase Auth (`@supabase/ssr`) with Google OAuth for sign-in; a root
  `proxy.ts` (Next.js 16 renamed "middleware" to "proxy") redirects any
  request to `/login` unless it's already `/login` or `/auth/callback`.
- Zod schema (`src/lib/validation/questionnaire.ts`) shared between the
  client form and the server route — one source of truth for validation
  rules, no duplicated logic to drift out of sync.
- Claude API (`claude-opus-5`) called via `client.messages.parse()` with a
  Zod output schema (`src/lib/ai/riskScoring.ts`), so the response is
  always a valid `{ riskLevel, explanation }` — no free-form JSON parsing
  or regex extraction.

**Why one API route does the whole pipeline**
`POST /api/questionnaire` validates the form, inserts the questionnaire
row, calls Claude for the risk score, inserts the risk result, selects
matching payment routes, and links them — all in one request. This
mirrors the flow diagram in `docs/PACKET.md` (validate → AI → payment
routes → combined screen) and, more importantly, makes it structurally
impossible for the frontend to receive a risk score without payment
routes in the same response. `ResultScreen.tsx` then renders the risk
card and the payment-route list (or its fallback) in a single return
block, so there's no code path that shows risk alone.

**Payment route matching**
Simple type-based matching in `src/lib/paymentRoutes.ts`: high risk
prefers `imss_route` + `installment_plan`, moderate prefers
`installment_plan` + `community_fund`, low prefers `community_fund` +
`installment_plan`. Falls back to any active route if none of the
preferred types are seeded, and to an explicit "we're finding you a
route" UI state if the payment_routes table is empty — this is the state
the security floor requires ("never show risk alone").

**RLS design**
- `questionnaire_responses` / `risk_results`: standard `user_id =
  auth.uid()` policies for select/insert/update.
- `payment_routes`: shared reference data, readable by any authenticated
  user, writable only via migration/service role (no insert/update
  policy for the `authenticated` role).
- `risk_result_routes`: no `user_id` column of its own — access is
  derived from the ownership of the parent `risk_results` row via an
  `exists (...)` subquery in both the select and insert policies.

**Setup left to the user (per their own choice, not blocked)**
- Create the Supabase project, enable the Google OAuth provider, and add
  the URL/anon key to `.env.local` (see `.env.local.example`).
- Run `supabase/migrations/0001_init.sql` in the SQL editor.
- Add a real `ANTHROPIC_API_KEY` to `.env.local` — no key was available
  in the build environment, so `scoreRisk()` is type-checked but not yet
  live-tested end to end.

## 2026-09-11 — Test plan pass

**Mechanical pass**
Ran the questionnaire Zod schema directly (Node, no live backend) against
an empty object and a malformed object (age: 999, wrong types, invalid
enum) — both correctly reject with per-field Spanish messages and never
reach `success: true`; a valid object passes. `npm run build` / `npm run
lint` are clean at every commit. Full DB-write and Google-login testing
still needs real Supabase + Anthropic credentials (see below) — not done
here.

A code-review pass on the Commit 5 diff found and fixed 4 real bugs
before commit: an unlogged/silently-swallowed `risk_result_routes` insert
error, an unnecessary sequential round-trip (risk_results insert and
payment-route lookup only depend on `riskAssessment.riskLevel`, not on
each other — now run via `Promise.all`), a per-request `new Anthropic()`
instead of a module-level singleton, and a silently-swallowed `scoreRisk`
failure with no server log.

**Persona pass (Doña Carmen)**
Built temporary, uncommitted preview routes (`/dev-preview/*`, reverted
after) to render the login/questionnaire/result screens without live
credentials, screenshotted them, and ran a fresh persona-test agent (no
shared context) narrating Doña Carmen's reaction to each screenshot in
order. Full findings, worst-to-least-bad:

1. **(fixed)** Fallback result screen (high risk + no payment route
   available) showed only "vuelve a intentarlo en unos minutos" — a
   frightening "riesgo alto" with zero actionable next step, the single
   most likely point to make her close the app for good.
   `ResultScreen.tsx`'s fallback now adds "Mientras tanto, no esperes:
   acude a tu centro de salud o clínica más cercana" when risk is high —
   no fabricated phone numbers/addresses, since guessing real institution
   contact details would be its own harm.
2. (logged, not fixed — deferred) The word "simulado" appears 4+ times
   on the result screen right next to a red "riesgo alto", which reads
   as "none of this is real" and undercuts trust in the payment routes.
   Consider consolidating the simulated-disclosure to one clear line
   instead of repeating it per element.
3. (logged, not fixed — deferred) Google sign-in is required with no
   explanation of why or what data is shared — first-touch distrust
   before she's seen any value from the app.
4. (logged, not fixed — deferred) The insurance-status question sits
   right after a screen that mentions "payment," which reads as "they're
   asking so they can charge me differently."

Per the packet's instruction to fix only the worst one before the
deadline, only #1 was fixed this session; #2-4 are real candidates for
the next pass.

**Setup left to the user (per their own choice, not blocked)**
- Create the Supabase project, enable the Google OAuth provider, and add
  the URL/anon key to `.env.local` (see `.env.local.example`).
- Run `supabase/migrations/0001_init.sql` in the SQL editor.
- Add a real `ANTHROPIC_API_KEY` to `.env.local` — no key was available
  in the build environment, so `scoreRisk()` is type-checked but not yet
  live-tested end to end.

## 2026-09-12 — Real Supabase project + switch to email/password auth

- User provided the real Supabase project URL + anon key; added to
  `.env.local` (gitignored, confirmed not tracked).
- Verified against the live project via REST: `payment_routes` exists and
  returns `[]` to an anon request (RLS correctly blocking the
  non-authenticated role — confirms the migration was already run, not
  that the table is missing). Checked `/auth/v1/settings`: email/password
  is enabled, signups are allowed, and `mailer_autoconfirm: false` — new
  accounts must click a confirmation-email link before they can sign in.
- **Switched auth from Google OAuth to Supabase email + password**, per
  explicit user request ("no necesito configurar nada en Google Cloud").
  `src/app/login/page.tsx` now has a single form with a sign-in/sign-up
  toggle: `signInWithPassword` for existing users,
  `signUp({ emailRedirectTo: .../auth/callback })` for new ones. Since
  this project requires email confirmation, a fresh sign-up shows "revisa
  tu correo" instead of redirecting — `data.session` is null until the
  user clicks the confirmation link, which lands on `/auth/callback`
  (unchanged — it already generically exchanges any `code` param for a
  session, so it didn't need to know or care which auth method produced
  it). `docs/PACKET.md`'s Auth row and security-floor checklist item
  updated to match.
- This also happens to resolve persona finding #3 from the 2026-09-11
  pass (distrust from an unexplained Google-account request) — trades it
  for the more familiar email+password friction instead.

## 2026-09-12 — Risk scoring switched to local rules (no Claude API)

Per explicit user request ("no voy a conseguir una clave real de
Anthropic por ahora"), replaced `src/lib/ai/riskScoring.ts` (Claude API
call) with `src/lib/riskScoring.ts` — a pure, synchronous, fully local
function. No network call, so nothing to catch: `POST
/api/questionnaire` calls it directly instead of through the `try/catch`
the API-call version needed, removing a dead failure path.

**Rules:** one point each for frequentThirst, blurryVision,
frequentUrination, fatigue, familyHistory, and age >= 45 (max 6). 0-1 =
low, 2-3 = moderate, 4-6 = high. The explanation is a template that lists
back whichever symptoms/factors were actually present, so it still reads
as personalized rather than generic. Verified low/moderate/high all
produce sensible output across a few hand-picked answer combinations.

Removed the now-unused `@anthropic-ai/sdk` dependency and
`ANTHROPIC_API_KEY` from `.env.local` / `.env.local.example`. Fixed the
result screen's disclaimer, which previously said "generado por
inteligencia artificial" — no longer true — to say the result is
simulated via simple rules instead, keeping the required "simulado /
not medical advice" labeling accurate. Updated `docs/PACKET.md`'s
architecture table row to match (Auth row was already updated in the
entry above).

## Tomorrow's first move
Test the live signup → email confirmation → sign-in → questionnaire →
rule-based result flow end to end with a real inbox (no AI credentials
needed anymore — nothing external left to configure for the core flow
to work). Then decide whether to act on persona findings #2 and #4 (the
repeated "simulado" wording, and the insurance question's placement)
before the demo.
