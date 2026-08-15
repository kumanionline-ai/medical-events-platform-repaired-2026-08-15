# Medical Events Platform V3 — Supabase-only deployment

This source uses Supabase exclusively for authentication, PostgreSQL data,
Storage, Realtime, analytics persistence, and server-side Edge Functions.
Google login is implemented through `supabase.auth.signInWithOAuth`.

Deploy this directory as a Vite application in Vercel.

Build command:
npm run build

Output directory:
dist

Required production environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Supabase Edge Function secrets (configured in Supabase, never in Vercel):
- GEMINI_API_KEY (used only by the `medassist` Edge Function)
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_API_VERSION (optional)

The `send-whatsapp` function also accepts the legacy `META_WHATSAPP_TOKEN`,
`META_WHATSAPP_PHONE_NUMBER_ID`, and `META_GRAPH_API_VERSION` names while
migrating older environments.

Never put AI, WhatsApp, database, or Supabase secret keys in `VITE_*` variables.
The browser communicates with these services only through authenticated
Supabase Edge Functions.
