# Research: Legacy Payment Endpoint Removal

## Scope Notes

- Target: Remove dormant Stripe checkout/portal/webhook endpoints and supporting utilities now that pricing flows are deprecated.
- Confirm no runtime dependencies remain outside those endpoints before deleting shared modules.

## Stripe Footprint Overview

- API routes:
  - `app/api/stripe/create-checkout/route.ts`
  - `app/api/stripe/create-portal/route.ts`
  - `app/api/webhook/stripe/route.ts`
- Shared utility: `libs/stripe.ts` (initialises client, checkout + portal helpers, session retrieval).
- Config: `config.ts` exposes `stripe.plans`, typed by `ConfigProps`.
- Marketing components/pages still reference pricing (e.g., `components/Pricing.tsx`, `app/pricing/page.tsx`) but are no longer part of current roadmap.
- Tests: `tests/e2e/payments/checkout.spec.ts` exercises Stripe mock mode.
- Documentation already updated to remove pricing references; remaining mentions in `research.md` flagged as legacy context.

## Dependency Checks

- `libs/stripe.ts` only imported by the three API routes above—safe to remove once routes deleted.
- No other server/client modules consume Stripe types.
- Removing `config.stripe` requires updating `types/config.ts` and any component expecting it (`components/Pricing.tsx`).
- OpenAPI spec (`openapi.yaml`) still documents Stripe endpoints.
- Marketing copy assets referencing Stripe (e.g., testimonials) are non-functional; optional whether to edit now.

## Risks & Mitigations

- **Risk**: Type errors from `ConfigProps` or unused imports after removal → Update typings and components accordingly.
- **Risk**: Test suite references removed endpoints → delete/adjust `tests/e2e/payments/checkout.spec.ts`.
- **Risk**: Environment variables (`STRIPE_*`) still referenced in tooling (e.g., `.env.example`). Need to review and prune to avoid confusion.
- **Risk**: Build may fail if `/pricing` still imports stripped config. Options: (a) retire pricing page/components alongside endpoints; (b) gate behind feature flag.
- **Observation**: Supabase `stripe_events` table remains in migrations; harmless but can be cleaned separately if desired.

## Decision Points

1. Remove API route directories and `libs/stripe.ts`.
2. Drop Stripe-specific config/types/env entries.
3. Retire marketing components/page dependent on Stripe pricing (delete or stub).
4. Clean up tests and OpenAPI documentation referencing Stripe endpoints.
5. Update sample env files or scripts referencing Stripe keys.
