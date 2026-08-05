# CardSmart V2 for Netlify

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
- Wallet persistence is not included in this version.
