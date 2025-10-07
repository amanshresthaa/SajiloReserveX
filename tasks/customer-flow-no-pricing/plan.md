# Plan: Update Customer Frontend Architecture (No Pricing/Stripe)

## Objective

Rework the existing customer frontend architecture documentation so it reflects the current scope—customer reservation journey, account management, marketing content—without any pricing upgrade flow or Stripe integration dependencies.

## Target Artifacts

- `tasks/customer-frontend-architecture/sprint-3-plan.md`
- `tasks/customer-frontend-architecture/sprint-plan.md`
- `tasks/customer-frontend-architecture/sprint-2-plan.md` (cleanup backlog history)
- `tasks/customer-frontend-architecture/02-information-architecture.json`
- `tasks/customer-frontend-architecture/03-content-specification.md`
- `tasks/customer-frontend-architecture/04-routing-navigation.tsx`
- `tasks/customer-frontend-architecture/08-edge-cases.md`
- `tasks/customer-frontend-architecture/09-performance-a11y-seo.md` (ensure messaging matches new scope)
- `tasks/customer-frontend-architecture/10-analytics-spec.md`
- `tasks/customer-frontend-architecture/11-acceptance-test-plan.md`
- `tasks/customer-frontend-architecture/01-requirements-analysis.md`
- `tasks/customer-frontend-architecture/plan.md` (master blueprint)
- `tasks/customer-frontend-architecture/12-final-output.md` (composite spec)

(Other docs only touched if referenced sections become orphaned. Codebase remains untouched.)

## Guiding Principles

- Preserve existing structure and reusable patterns (React Query, Shadcn UI, analytics helpers, accessibility rules).
- Emphasize mobile-first, accessible flows per user-provided MUST/SHOULD/NEVER guidance.
- Maintain TDD posture by keeping analytics/test plans consistent with available Vitest/Playwright patterns (even if no new tests added now).

## Work Breakdown

1. **Backlog & Sprint Docs**
   - Replace pricing stories across `sprint-plan.md`, `sprint-2-plan.md`, and `sprint-3-plan.md` with initiatives that strengthen reservation discovery, auth guardrails, analytics, and content.
   - Adjust sprint goals, deliverables, risks, QA checklists to remove Stripe references and point to reservation-centric validation (e.g., booking wizard, dashboard, auth).
   - Ensure estimates/dependencies remain realistic; remove Stripe keys requirement.

2. **Architecture Specifications**
   - Update IA JSON to remove `/pricing` node; confirm navigation arrays point to remaining marketing pages (home, blog, signin, dashboard, profile, reserve).
   - Revise content spec: replace pricing section with alternative customer value content (e.g., `/reserve` hero, loyalty messaging) or simply omit to avoid dangling references.
   - Update routing/navigation TypeScript doc: delete `/pricing` route examples, adjust nav tree diagrams and examples.
   - Review performance/a11y/SEO doc to remove references to pricing calculators or Stripe-specific schema; emphasize booking/restaurant schemas already in use.

3. **Edge Cases & Analytics**
   - Prune pricing-related rows (Stripe failures) from edge-case table; ensure coverage for booking, auth, dashboard, and marketing surfaces.
   - Remove `pricing_checkout_clicked` and `checkout_session_error` events from analytics tables + machine-readable catalog; confirm remaining events align with actual flows/tests.
   - Update acceptance test plan to reflect reservation and auth smoke tests; exclude pricing upgrade scenarios.

4. **Consistency & Cross-References**
   - Run `rg` spot-check for lingering "pricing" or "Stripe" mentions within customer frontend tasks after edits; resolve false positives by either rewriting or annotating.
   - Validate JSON/TypeScript formatting manually (since plan requires documentation only).
   - Ensure documentation still references Shadcn components, mobile-first layouts, and analytics instrumentation patterns observed in code (`ReservationDetailClient`, wizard steps).

## Verification

- Manual proofreading of edited docs for coherence and removal of deprecated scope.
- Use `rg "pricing" tasks/customer-frontend-architecture` to confirm only intentional historical mentions remain (e.g., changelog notes); resolve anything within active specs.
- If feasible, run existing analytics/unit tests touched indirectly (`vitest --run tests/features/wizard/*.analytics.test.tsx`) to ensure documentation aligns with implemented behaviors, or note if testing skipped.

## Open Questions (to raise if needed)

- None identified; scope clarified by user.
