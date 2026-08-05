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
