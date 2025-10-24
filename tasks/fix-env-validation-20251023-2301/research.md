# Research: Fix Env Validation

## Existing Patterns & Reuse

- `lib/env.ts` centralises environment parsing with Zod and caches the validated object. It expects all required server env vars (e.g. `SUPABASE_SERVICE_ROLE_KEY`) to be present before returning feature flags (`lib/env.ts#L12-L131`).
- A client-safe accessor already exists in `lib/env-client.ts`, which only references `NEXT_PUBLIC_*` variables to avoid leaking server secrets (`lib/env-client.ts#L1-L28`).

## External Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) – confirms only `NEXT_PUBLIC_*` variables are available in the browser.
- Internal onboarding doc reminds us to source env values from `.env.local` but does not change client availability (`documentation/DEVELOPER_ONBOARDING.md#L95-L130`).

## Constraints & Risks

- Client bundles must not import modules that require server-only env vars; otherwise, Turbopack/Next.js strips them, yielding `undefined` at runtime.
- `FEATURE_EDIT_SCHEDULE_PARITY` is intentionally server-only. Exposing the raw env name to the client would require renaming the flag and updating deployment secrets.
- Changes must avoid touching Supabase credentials to stay aligned with security guidelines.

## Open Questions (and answers if resolved)

- Q: Are Supabase env vars actually missing, or are they just unavailable in the browser?
  A: Running `pnpm validate:env` succeeds, proving the vars exist server-side. The browser import of `lib/env` is what fails.
- Q: Do any other client components import `lib/env`?
  A: `rg` indicates only `EditBookingDialog` does so, so the fix scope is limited.

## Recommended Direction (with rationale)

- Stop importing `lib/env` inside client components. Instead, resolve `env.featureFlags.editScheduleParity` on the server (`src/app/(authed)/my-bookings/page.tsx`) and pass the boolean through props to `MyBookingsClient` → `EditBookingDialog`. This keeps the flag server-controlled without exposing secrets and aligns with the existing pattern of server-driven hydration.
