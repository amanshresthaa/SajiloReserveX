# Research: Vercel Build Env Validation Failure

## Existing Patterns & Reuse

- `scripts/validate-env.ts` loads `.env.local`, `.env.development`, and `.env` before validating via `getEnv()`.
- `lib/env.ts` centralizes env parsing using zod schemas in `config/env.schema.ts`.
- Production schema required `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, and `RESEND_FROM`.
- Vercel provides `VERCEL_URL` (no protocol) during builds; project-specific envs are configured in Vercel settings.

## External Resources

- Vercel docs: `VERCEL_URL` and environment variable behavior during build/deploy.
- Zod conditional validation patterns (`superRefine`).

## Constraints & Risks

- We cannot modify Vercel project settings from code.
- Build must pass even if `NEXT_PUBLIC_*` URLs are not explicitly set, provided they are derivable from `VERCEL_URL`.
- Email provider settings may not be available during preview builds; we should not block the build when email is unused.

## Open Questions (and answers if resolved)

- Q: Can we safely derive public URLs from `VERCEL_URL`?  
  A: Yes; prepend `https://` if missing. This is standard practice for Next.js on Vercel.

- Q: Should production always require Resend credentials?  
  A: Only when email sending is enabled. We enforce an "all or none" rule to prevent partial misconfig without blocking builds.

## Recommended Direction (with rationale)

- Prefill `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` from `VERCEL_URL` in `lib/env.ts` before schema validation. Ensures deterministic URLs in Vercel without manual env setup.
- Relax production schema for Resend: require both `RESEND_API_KEY` and `RESEND_FROM` only if either is provided. Let runtime email helpers guard sending when absent.
- Update `.env.local.example` and onboarding docs to reflect the new behavior and recommended Vercel configuration.
