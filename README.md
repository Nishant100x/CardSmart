# CardSmart V10.8 — Logout + Catalogue Monitoring

## V10.8 production release (August 2026)

- Makes Log out a prominent Account action on desktop and mobile, with loading and failure handling.
- Adds an approval-gated Supabase Edge Function for official reward, T&C, fee, announcement and offer monitoring.
- Seeds 24 official sources covering the 12 priority cards plus issuer-wide offer and announcement pages.
- Establishes a content-hash baseline on first fetch; OpenAI runs only after a later source change.
- Uses structured output to create deduplicated `pending` change candidates with evidence and confidence.
- Stores source snapshots and run history for traceability and troubleshooting.
- Never auto-publishes a card version or offer. A human must review and apply every detected change.

### Monitoring activation

1. Run `supabase/card-monitoring-setup.sql` in the Supabase SQL Editor.
2. Deploy `supabase/functions/card-monitor` with `supabase functions deploy card-monitor`.
3. Add backend-only Edge Function secrets: `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5.6-luna`, and a random `MONITOR_SECRET`.
4. Invoke the function once manually. The first successful checks establish baselines and should create zero candidates.
5. Store the project URL and the same monitor secret in Supabase Vault, then run `supabase/card-monitoring-schedule.sql`.
6. Use `supabase/card-monitoring-verify.sql` to inspect runs, source health and the pending review queue.

The function is intentionally configured with Supabase JWT verification disabled because Cron is not a user session. It rejects every request unless the `x-monitor-secret` header exactly matches the backend-only `MONITOR_SECRET`.

## V10.7 Supabase catalogue rollout (August 2026)

- Loads active cards and their published reward versions from `card_catalog` and `card_versions` in Supabase.
- Keeps the bundled 97-card snapshot as an availability fallback only; it is no longer the primary catalogue source.
- Reconstructs recommendation rules, confidence, caps, exclusions, fees, eligibility and discovery metadata from published database versions.
- Rejects empty or implausibly small catalogue responses instead of replacing the working fallback with broken data.
- Preserves the current ordering of the approved catalogue while allowing new database cards to appear after existing models.
- Does not modify the existing `public.cards` user-wallet table.
- `supabase/card-catalog-seed-v1.sql` is the exact 97-card seed already loaded into production.
- Automated source checks are implemented in V10.8; review approval remains deliberately manual and never auto-publishes issuer changes.

## V10.6 product experience and production functionality (August 2026)

- Restores the approved V10.6 black, off-white and lime product system with sans-serif typography across desktop and mobile.
- The opening experience now explains CardSmart's full job: choose the best card for a payment, track extra rewards and decide whether another card is worth adding.
- The public opening is a complete production landing journey with use cases, a real payment comparison, how-it-works, incremental-value logic, privacy, FAQs and a final CTA.
- Adds stable job-based routes for Choose a card, My cards, Find a card, Savings and Account.
- Recommendation results lead with the winning card, expected reward, extra value and ranked alternatives, with calculation details available on demand.
- Keeps Netlify + Supabase as the production runtime architecture.
- Re-running a saved payment restores merchant, amount, category and payment route.
- Guest payment context and wallet selections survive signup and email verification.
- Wallet additions/removals reload from Supabase after every successful save.
- “Check a card I want” is now connected to an actual selected card and calculation.
- New-card value is incremental versus the current wallet and shown after annual fee.
- Only cards with modelled fee and basic income requirements can produce a quantified new-card result.
- Account deletion calls the authenticated Supabase deletion function and reports failures honestly.
- Profile, wallet and activity migrations include explicit authenticated-role grants and RLS ownership policies.
- `npm test` covers recommendation, replay, wallet-contract, discovery, catalogue parsing and production-flow checks.

## Product system foundation

- Replaces the dashboard-like left sidebar with a restrained top navigation on desktop and a compact bottom navigation on mobile.
- Uses one system sans-serif type family, a documented spacing/radius scale, higher contrast and consistent surface geometry.
- Rebuilds Home as one immersive “know the right card before you pay” experience with a live recommendation preview.
- Keeps the default payment journey to two inputs: where the user is paying and how much.
- Rewrites primary copy in user language and moves rule confidence, cap mechanics and issuer assumptions into supporting details.
- Results lead with the card to use, expected reward and money gained versus the next-best card.
- Applies the same typography, spacing, surface and interaction rules across Wallet, Find a card, Savings, Profile and account modals.
- Preserves the V7 recommendation engine, the full 97-card catalogue and all existing Supabase persistence behaviour.
- The repeatable V10 production migration is in `supabase/v10-production-migration.sql`; review the existing schema before running it.

## V8 payment-copilot UX

- Home is now a single, high-focus “before you pay” command surface instead of a dense rewards form.
- Category and payment route stay available, but move into optional fine-tuning so the default journey needs only merchant and amount.
- Results lead with one decisive card choice, expected reward and incremental value; calculation details and assumptions use progressive disclosure.
- Navigation now follows user jobs: Pay smart, My cards, Get a card and My savings.
- My cards includes wallet-readiness and cap-usage summaries instead of functioning only as a card gallery.
- My savings turns saved activity into an outcome scoreboard with incremental value and expected rewards.
- Mobile uses a tighter command flow, a persistent result action area and job-based bottom navigation.
- V8 changes presentation and information hierarchy only. The V7 ranking engine, Supabase schema and persistence behavior remain intact.
- No new Supabase migration is required for V8.

## V7 recommendation trust engine

- The complete existing card catalogue remains available; no cards were removed.
- Users can explicitly select spend category and payment route, or use auto-detection with visible assumptions.
- Structured issuer rules apply merchant overrides, channel requirements, exclusions and known cap usage before ranking wallet cards.
- Results show gross reward, cap adjustments, applied rule and one of three confidence levels: `verified`, `reviewed`, or `indicative`.
- Broad-catalogue legacy rates remain supported, but are clearly marked indicative until their full issuer rule is modelled.
- Priority issuer rules were reviewed in August 2026 for HDFC Swiggy, SBI Cashback, Axis Atlas, HDFC Millennia, Amazon Pay ICICI, HSBC Live+, HDFC Infinia, Axis ACE, Tata Neu Infinity, Airtel Axis, Amex MRCC and Amex Platinum Travel.
- `npm test` runs 40 automated recommendation cases covering classification, payment routes, exclusions, caps, legacy catalogue fallbacks and ranking.
- No new Supabase migration is required for V7.

## Loading-state reliability

- The Supabase auth listener stays stable instead of resubscribing on app-state changes.
- Stale wallet, profile, and activity requests cannot control the latest loading state.
- Data loads time out after 15 seconds and show a recoverable error instead of spinning forever.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm install` and `npm run dev`.

## Netlify deployment

- Build command: `npm run build`
- Publish directory: `dist`
- Add the two `VITE_SUPABASE_*` variables under Site configuration → Environment variables.
- After Netlify gives you a live URL, add it to Supabase Authentication → URL Configuration.
  - Site URL: `https://your-site.netlify.app`
  - Redirect URL: `https://your-site.netlify.app/**`

Never expose a Supabase service-role key in this frontend.

## Profile persistence

- The signup flow saves `name` and normalized `mobile_number` in Supabase Auth metadata.
- `public.profiles` stores the recommendation profile and category-wise monthly spends.
- The repeatable database migration is in `supabase/profile-persistence.sql`.
- If the profile migration was already run before mobile support was added, run `supabase/mobile-contact-migration.sql` once.
- Mobile numbers are collected for contact but remain unverified until an OTP flow sets `mobile_verified_at`.

## Activity persistence

- Run `supabase/interaction-persistence.sql` before deploying this frontend.
- Every signed-in recommendation is saved as `checked` in `public.interactions`.
- Confirming “I paid with this card” updates the same row to `tracked`.
- My Activity loads the newest 100 saved interactions for the signed-in user.
- Row-level security restricts every interaction to its owner.

## Wallet persistence

- Run `supabase/wallet-persistence.sql` before deploying this frontend.
- The existing `public.cards` table remains the wallet source of truth; no duplicate wallet table is created.
- Signed-in users can add, remove, or clear catalogue cards and see the same wallet after refresh or on another device.
- Picker changes remain a draft until the user presses Save, so closing the picker does not silently alter the wallet.
- Manual or tracked cap-usage estimates are stored on the user's own card row.
- Existing custom or unknown legacy card rows are preserved when the catalogue wallet is updated.
- Row-level security restricts every card row to its owner.
