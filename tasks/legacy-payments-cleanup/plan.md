# Plan: Legacy Payments Cleanup

## Objective

Remove the unused Stripe checkout/portal/webhook endpoints and supporting artifacts so the codebase matches the updated pricing-free architecture.

## Steps

1. **Endpoint & Utility Removal**
   - Delete `app/api/stripe/*` and `app/api/webhook/stripe/route.ts`.
   - Remove `libs/stripe.ts` and any exports/imports referencing it.
2. **Config & Types**
   - Update `config.ts` and `types/config.ts` to eliminate the `stripe` block.
   - Adjust or retire components relying on `config.stripe` (likely delete `app/pricing/page.tsx` + `components/Pricing.tsx`).
3. **Tests & Documentation**
   - Remove `tests/e2e/payments/checkout.spec.ts` and any other Stripe-specific tests/fixtures.
   - Update `openapi.yaml` or other specs referencing Stripe endpoints.
   - Prune `.env.example` / `README` entries mentioning Stripe keys if present.
4. **Marketing Copy (Optional)**
   - If time permits, strip obviously outdated marketing snippets referencing Stripe payments (non-functional text).
5. **Verification**
   - Run `pnpm lint` / `pnpm test` (or targeted check) to ensure no TypeScript errors.
   - `rg "stripe"` to confirm only intentional marketing mentions remain.

## Open Questions

- Should marketing testimonials referencing Stripe be retained as-is? (default: leave textual content unless requested).
- Confirm `.env` or CI secrets not required elsewhere before removing hints.
