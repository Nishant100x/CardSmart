# CardSmart V2 for Netlify

## V9 premium product system

- Replaces the dashboard-like left sidebar with a restrained top navigation on desktop and a compact bottom navigation on mobile.
- Uses one system sans-serif type family, a documented spacing/radius scale, higher contrast and consistent surface geometry.
- Rebuilds Home as one immersive “know the right card before you pay” experience with a live recommendation preview.
- Keeps the default payment journey to two inputs: where the user is paying and how much.
- Rewrites primary copy in user language and moves rule confidence, cap mechanics and issuer assumptions into supporting details.
- Results lead with the card to use, expected reward and money gained versus the next-best card.
- Applies the same typography, spacing, surface and interaction rules across Wallet, Find a card, Savings, Profile and account modals.
- Preserves the V7 recommendation engine, the full 97-card catalogue and all existing Supabase persistence behaviour.
- No new Supabase migration is required for V9.

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
