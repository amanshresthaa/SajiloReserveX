# Implementation Plan: Vercel Build Env Fix

## Objective

Unblock Vercel builds by deriving required public URLs from `VERCEL_URL` and making production email env requirements conditional.

## Success Criteria

- [ ] Vercel build passes without setting `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_SITE_URL` explicitly.
- [ ] If one of `RESEND_API_KEY`/`RESEND_FROM` is set, both are required; otherwise validation passes.
- [ ] Local dev remains unchanged; `.env.local.example` includes both public URLs.
- [ ] Onboarding doc explains derivation and conditional email rules.

## Architecture & Components

- `lib/env.ts`: Prefill/normalize URL envs using `VERCEL_URL`.
- `config/env.schema.ts`: Use `superRefine` to enforce conditional email requirement and presence of URLs in production.
- Documentation updates.

## Testing Strategy

- Run `tsx scripts/validate-env.ts` locally with/without envs to check behavior.
- Simulate Vercel by setting `VERCEL_URL` and `NODE_ENV=production` with missing `NEXT_PUBLIC_*` and verify pass.
- Verify error when only one of Resend vars is present.

## Rollout

- Merge; deploy to Vercel. Add Vercel env for canonical URLs and email when available.
