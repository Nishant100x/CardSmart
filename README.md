# CardSmart V10.6 for Netlify + Supabase

This is the complete V10.6 light-first interface connected to the production Netlify and Supabase architecture.

## What works

- Search the 97-card catalogue and compare a real wallet.
- Merchant, amount, category, payment route, Prime status and known cap usage affect Pay results.
- Anonymous wallet selections survive signup and are merged into the authenticated wallet.
- Signup, login, session refresh and logout use Supabase Auth.
- Add/remove card changes persist in `public.cards`.
- Confirmed payments persist in `public.interactions`.
- “Try this payment again” restores merchant, amount, category and payment route.
- Find a Card calculates incremental annual rewards over the current wallet and subtracts annual fee.
- Account preferences persist in `public.profiles.user_preferences`.
- Account deletion removes the Supabase Auth user and cascades to their profile, wallet and activity.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm ci`.
4. Run `npm test` and `npm run build`.
5. Run `npm run dev`.

Never add a Supabase service-role key to the frontend or Netlify client environment.

## Supabase setup

Apply the SQL files in this order after checking which tables and columns already exist:

1. `supabase/profile-persistence.sql`
2. `supabase/wallet-persistence.sql`
3. `supabase/interaction-persistence.sql`
4. `supabase/v10-production-migration.sql`

The files use repeatable `if not exists`, policy replacement and function replacement patterns. The V10 migration adds saved preferences and the authenticated self-service account-deletion function.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Required variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Add the final Netlify URL in Supabase Authentication → URL Configuration as both the Site URL and an allowed redirect URL.

## Verification

`npm test` covers 50 recommendation and production-flow contracts. `npm run build` runs strict TypeScript checking before producing the deployable Vite bundle.
