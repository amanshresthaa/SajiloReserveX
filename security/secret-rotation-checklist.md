# Secret Rotation Checklist

> Use this checklist whenever credentials are leaked or rotated as part of Sprint 0.

## 1. Supabase
- Regenerate `anon` and `service_role` keys in **Settings → API**.
- Update keys in deployment platform (e.g. Vercel, Supabase branch secrets).
- Redeploy application and invalidate older build environments.
- Confirm old keys rejected via `curl` request to Supabase REST endpoint.

## 2. Stripe
- Create restricted API keys for each environment (*Developers → API keys*).
- If webhooks were exposed, rotate the Webhook Signing Secret under **Developers → Webhooks**.
- Update environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and publishable keys.
- Run the new keys against `stripe login` / `stripe listen` to verify access.

## 3. Resend (Transactional Email)
- Generate new API key under **API Keys**; delete the compromised key.
- Update `RESEND_API_KEY` and `RESEND_FROM` in deployment secrets.
- Send a smoke test email via `node --env-file=.env.local test-email.mjs recipient@example.com`.

## 4. Repository Hygiene
- Ensure `.env.local` is not committed; developers copy from `.env.local.example`.
- Run `pnpm secret:scan` before pushing to guarantee a clean tree.
- Document rotation completion in the security log (see `security/security-log.md`).

## 5. Provider Validation
- Supabase: check project audit logs for rejected auth attempts with old keys.
- Stripe: review the **Events** dashboard to ensure webhook signatures match the new secret.
- Resend: confirm no emails sent using the old API key after the rotation timestamp.

Keep this file updated as the provider list changes.
