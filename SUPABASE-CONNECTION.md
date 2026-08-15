# Supabase connection

This build is connected to the `Medical Events Platform` project in the
`Superbase Connect` organization.

- Project ref: `nryqkooufxdyhmojtnqu`
- Region: `eu-west-1`
- Frontend: Supabase Auth, Database, Storage, Realtime and Edge Functions
- Edge Functions: `medical-news`, `medassist`, `send-whatsapp`

Medical news is active. AI external processing and live WhatsApp delivery are
deployed as authenticated, safely disabled endpoints. They require explicit
administrator authorization of external data transmission before provider
logic and credentials are enabled. No server credential belongs in the frontend.
