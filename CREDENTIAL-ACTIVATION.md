# AI and WhatsApp credential activation

The database controls and authenticated Edge Function routes are prepared.
Provider credentials must be created by the account owner and stored only in
Supabase Edge Function Secrets.

## Gemini

1. Select the Google Cloud / AI Studio project that will own billing and usage.
2. Create a Gemini API key restricted to the Generative Language API.
3. Add it in Supabase Edge Function Secrets as `GEMINI_API_KEY`.
4. Replace the safely disabled `medassist` function with the approved provider implementation.

## Meta WhatsApp Cloud API

1. Select the Meta Business portfolio and verified WhatsApp Business Account.
2. Register and verify the sender phone number.
3. Create a permanent system-user access token with the minimum WhatsApp permissions.
4. Add `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and optionally
   `WHATSAPP_API_VERSION` in Supabase Edge Function Secrets. The function also
   accepts the legacy `META_*` names during migration.
5. Deploy the included `send-whatsapp` Edge Function. It verifies the caller,
   enforces the approved-recipient list, and records delivery status.

Recipients are controlled in `whatsapp_allowed_recipients`. Every outbound
message is saved in `crm_messages` as `queued` before delivery, then updated to
`sent` or `failed`. Never put these credentials in Vercel or a `VITE_*` value.
