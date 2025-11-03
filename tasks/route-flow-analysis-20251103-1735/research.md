# Research: Route & Flow Analysis (SajiloReserveX)

Generated: 2025-11-03 (UTC)

## Requirements

- Functional:
  - Provide an in-depth, comprehensive analysis of all routes and their start→finish flows, including redirects, auth gating, and API touchpoints.
  - Map real user journeys (customer, marketing, invitee, ops) across page routes and server APIs.
  - Summarize current E2E coverage and gaps.
- Non‑functional (a11y, perf, security, privacy, i18n):
  - Respect existing guard patterns and redirects; note inconsistencies.
  - Avoid leaking secrets; rely on documented test endpoints and envs.
  - Keep analysis actionable and traceable to code/tests with file refs.

## Existing Patterns & Reuse

- App Router with server redirects via `redirect()` from `next/navigation`.
  - Example: `src/app/(ops)/ops/(app)/page.tsx:16` redirects unauthenticated users to `/signin?redirectedFrom=/ops`.
- Booking wizard embedded in pages and wired via DI (navigator) to perform navigation.
  - Customer close action navigates to `/thank-you`: `components/reserve/steps/ConfirmationStep.tsx:21` and `reserve/features/reservations/wizard/hooks/useReservationWizard.ts:305`.
- Confirmation page fetch via token: `src/app/thank-you/page.tsx:73` calls `/api/bookings/confirm?token=...`.
- Booking creation API can issue `confirmationToken` (non-fatal if unavailable): `src/app/api/bookings/route.ts:644` to `src/app/api/bookings/route.ts:662`.
- Guarding via server components instead of global middleware; guarded pages redirect to `/signin?redirectedFrom=<route>`.
- E2E test harness (Playwright) with session bootstrap and test-only endpoints under `/api/test/*`.

## External Resources

- COMPLETE_ROUTE_MAP: `COMPLETE_ROUTE_MAP.md`
- Summary counts & guards: `ROUTE_SUMMARY.md`
- E2E coverage summaries: `tests/e2e/E2E_TEST_COVERAGE_SUMMARY.md`, `tests/e2e/ADDITIONAL_COVERAGE_SUMMARY.md`

## Constraints & Risks

- Inconsistency: `/thank-you` is currently public (no redirect on unauth), while marketing tests expect an unauth redirect to `/signin?redirectedFrom=/thank-you`.
- Token-based confirmation on `/thank-you` isn’t connected end-to-end by the wizard (no redirect to `/thank-you?token=...`).
- Several Ops E2E tests require selector/route fixes (e.g., `restaurant-settings.spec.ts` still uses `/ops/settings`).
- Route coverage gaps: blog, browse, legal pages have limited/no E2E.

## Open Questions (owner, due)

- Q: Should `/thank-you` require auth or remain public with `?token`? (Owner: PM/Eng lead)
  A: —
- Q: Do we want wizard to deep-link to `/thank-you?token=...` after success? (Owner: Eng)
  A: —
- Q: Unify guards via middleware or keep per-page server redirects? (Owner: Eng)
  A: —

## Recommended Direction (with rationale)

- Align `/thank-you` behavior with product intent:
  - Option A: Public with `?token` (no auth). Ensure wizard passes `confirmationToken` and navigate to `/thank-you?token=...` for rich confirmation details.
  - Option B: Auth-gated (consistent with current tests). Add redirect on unauth to `/signin?redirectedFrom=/thank-you`.
- Fix E2E mismatches quickly (low effort, high value): update `/ops/settings` → `/ops/restaurant-settings` and adjust selectors for team/walk‑in flows.
- Add a small E2E to click wizard “Close” and assert navigation to `/thank-you` to cover the final step of the booking flow.
- Consider centralizing guard checks in middleware or a tiny wrapper to reduce drift.

---

## Route Inventory & Guards (Summary)

From `ROUTE_SUMMARY.md`:

- Pages: 31 (7 dynamic)
- API Routes: 74 (24 dynamic)
- Total: 105
- Guards: public 95, auth 2, admin 8

Key page routes (representative, not exhaustive):

- Marketing/Customer: `/`, `/browse`, `/create`, `/checkout`, `/thank-you`, `/pricing`, `/privacy-policy`, `/tos`, `/blog` (+ author/category), `/item/[slug]`, `/reserve/r/[slug]`, `/reserve/[reservationId]`.
- Auth: `/signin`.
- Invitee: `/invite/[token]`.
- Customer (authed): `/my-bookings`.
- Ops (admin): `/ops`, `/ops/bookings`, `/ops/bookings/new`, `/ops/team`, `/ops/restaurant-settings`, `/ops/customer-details`, `/ops/tables`, `/ops/rejections`, `/ops/login`.

Representative APIs:

- Customer: `/api/bookings` (POST/PUT), `/api/bookings/confirm`, `/api/restaurants`, `/api/availability`, `/api/profile`.
- Invitee: `/api/team/invitations/[token]` (GET), `/api/team/invitations/[token]/accept` (POST).
- Ops: `/api/ops/bookings*`, `/api/ops/customers*`, `/api/ops/dashboard/*`, `/api/owner/team/invitations*`.
- Test helpers: `/api/test/*` (bookings, invitations, leads, playwright-session).

---

## Start→Finish Flows by Persona

### Customer Booking (Wizard)

- Start
  - Direct restaurant: `/reserve/r/[slug]` → loads wizard with venue context (`src/app/reserve/r/[slug]/page.tsx:58`).
  - Alternate: `/item/[slug]` → same wizard (`src/app/item/[slug]/page.tsx:140`).
- Steps
  - Plan → Details → Review → Confirmation (inline; no route change).
  - Submit booking → POST `/api/bookings` (returns `booking`, `bookings[]`, optional `confirmationToken`) (`src/app/api/bookings/route.ts:492`, `src/app/api/bookings/route.ts:644`).
  - Wizard success state rendered inline: `tests/e2e/reservations/booking-flow.spec.ts:33-74` asserts “Booking confirmed”.
- Finish
  - “Close” action → `/thank-you` (`components/reserve/steps/ConfirmationStep.tsx:21`, `reserve/features/reservations/wizard/hooks/useReservationWizard.ts:305`).
  - Current flow does NOT include token propagation to `/thank-you?token=...`.
- Post-booking
  - Manage at `/my-bookings` (auth required; redirects unauth to `/signin?redirectedFrom=/my-bookings`) (`src/app/(authed)/my-bookings/page.tsx:43`).

### Thank‑You Page

- Page: `src/app/thank-you/page.tsx`.
- With `?token=`: fetches `/api/bookings/confirm?token=...` to render details (`src/app/thank-you/page.tsx:73`), token validated/consumed by `src/app/api/bookings/confirm/route.ts`.
- Without token: shows generic thank-you content.
- Guarding: currently public; tests in marketing suite expect unauth redirect to `/signin?redirectedFrom=/thank-you` (inconsistency to resolve).

### Reservation Detail (Authed)

- Route: `/reserve/[reservationId]` (`src/app/reserve/[reservationId]/page.tsx`).
- Guard: redirects unauth to `/signin?redirectedFrom=/reserve/<id>` (`src/app/reserve/[reservationId]/page.tsx:56-70`).
- Capabilities: share, offline banner, download confirmation (tested in E2E: `tests/e2e/reservations/reservation-detail.spec.ts`, `tests/e2e/reservations/confirmation-download.spec.ts`).

### Marketing Journey

- `/create` → helps discover venues.
- `/checkout` (guide) → links to `/my-bookings` and `/create` (`src/app/checkout/page.tsx:112-155`).
- E2E validates navigation and structure (`tests/e2e/marketing/create-checkout-thankyou.spec.ts:200-236`).

### Invite Acceptance (Team Members)

- Start: `/invite/[token]` (server validates; invalid states render reasons) (`src/app/invite/[token]/page.tsx:23-41`).
- Accept: POST `/api/team/invitations/:token/accept` (`components/invite/InviteAcceptanceClient.tsx:56`, `src/app/api/team/invitations/[token]/accept/route.ts`).
- Finish: Attempt sign-in; on success, redirect to `/ops`; on failure, stay and instruct sign-in (`components/invite/InviteAcceptanceClient.tsx:74-94`).
- E2E covers valid/invalid, validation, error handling: `tests/e2e/invitations/invite-acceptance.spec.ts`.

### Ops (Admin)

- Entry: `/ops` (dashboard) → redirects unauth to `/signin?redirectedFrom=/ops` (`src/app/(ops)/ops/(app)/page.tsx:16`).
- Walk‑in booking: `/ops/bookings/new` (guarded) → wizard in ops mode; close navigates to `/ops` (`src/app/(ops)/ops/(app)/bookings/new/page.tsx:17-25`, ops client renders wizard).
- Team management: `/ops/team` (guarded) with invite CRUD via owner APIs (`src/app/(ops)/ops/(app)/team/page.tsx:23-32`).
- Settings: `/ops/restaurant-settings` (guarded). Note: tests still target `/ops/settings` and must be corrected.

---

## Redirects & Guarding (Matrix)

- Auth-gated pages redirect unauthenticated users to `/signin?redirectedFrom=<route>` via server `redirect()`:
  - `/my-bookings`: `src/app/(authed)/my-bookings/page.tsx:43`.
  - `/reserve/[reservationId]`: `src/app/reserve/[reservationId]/page.tsx:56-70`.
  - Ops: `/ops`, `/ops/bookings`, `/ops/bookings/new`, `/ops/team`, `/ops/restaurant-settings`, `/ops/customer-details`, `/ops/rejections` (see `src/app/(ops)/ops/(app)/**/page.tsx`).
- Public but with optional deep-linking:
  - `/thank-you` (today public; token optional) → consider gating or consistently using token.

---

## E2E Coverage Map (Highlights)

- Booking wizard: happy-path confirmation inline (no redirect assert) — `tests/e2e/reservations/booking-flow.spec.ts`.
- Thank‑you: marketing suite expects unauth redirect — `tests/e2e/marketing/create-checkout-thankyou.spec.ts:225-240`.
- Invite acceptance: comprehensive — `tests/e2e/invitations/invite-acceptance.spec.ts`.
- Ops team/settings/walk-in: present but need selector/route fixes — `tests/e2e/E2E_TEST_COVERAGE_SUMMARY.md`.
- Reservation detail + artifacts: share/offline/download — `tests/e2e/reservations/*`.
- Gaps: `/blog*`, `/browse`, legal pages mostly uncovered; add smoke tests.

---

## Gaps & Recommendations

1. Thank‑you flow cohesion
   - Choose: (A) Public + token deep-link (update wizard to navigate with `?token`), or (B) Auth‑gated (add redirect; update marketing tests if needed).
   - Add E2E: From wizard confirmation, click “Close” → assert `/thank-you` (and `?token` when implemented).
2. Fix E2E mismatches
   - `/ops/settings` → `/ops/restaurant-settings` across `tests/e2e/ops/restaurant-settings.spec.ts` (multiple occurrences).
   - Update selectors in team and walk‑in suites per current DOM.
3. Coverage expansion
   - Add smoke E2E for `/blog`, `/blog/*`, `/browse`, `/pricing`, `/privacy-policy`, `/tos` (load, key heading, primary links).
4. Guard consistency
   - Consider middleware or a small wrapper to centralize auth redirects, reducing drift and test flakiness.

---

## Flow Diagrams (Mermaid)

```mermaid
flowchart LR
  subgraph Customer Booking
    A[/reserve/r/[slug]\n(item/[slug])/] --> B[Wizard: Plan→Details→Review]
    B -->|POST /api/bookings| C{Created}
    C -->|Inline confirmation| D[Close]
    D --> E[/thank-you/]
    C -->|Token issued?| F{{confirmationToken}}
    F -->|Optional| E2[/thank-you?token=.../]
    E --> G[/my-bookings/]
  end
```

```mermaid
flowchart LR
  subgraph Ops Walk-in
    O[/signin/]->|redirectedFrom| O2[/ops/bookings/new/]
    O2 --> P[Wizard (ops mode)] --> Q{Submit}
    Q --> R[/ops/]
  end
```

---

## References (Code)

- Thank‑you page: `src/app/thank-you/page.tsx:73`, `src/app/thank-you/page.tsx:160`.
- Wizard close → thank‑you: `components/reserve/steps/ConfirmationStep.tsx:21`, `reserve/features/reservations/wizard/hooks/useReservationWizard.ts:305`.
- Booking API: `src/app/api/bookings/route.ts:644-662`.
- Confirmation API: `src/app/api/bookings/confirm/route.ts:21`.
- Guard examples:
  - Ops: `src/app/(ops)/ops/(app)/page.tsx:16`.
  - My bookings: `src/app/(authed)/my-bookings/page.tsx:43`.
  - Reservation detail: `src/app/reserve/[reservationId]/page.tsx:56-70`.
- Invite flows:
  - Page: `src/app/invite/[token]/page.tsx:23-41`.
  - Accept client: `components/invite/InviteAcceptanceClient.tsx:56-94`.

---

## Next Steps

- Decide on `/thank-you` model (auth‑gated vs token deep-link) and implement accordingly.
- Patch E2E for restaurant settings route; adjust team/walk‑in selectors.
- Add “Close to thank‑you” E2E.
- Add smoke coverage for content/legal routes.
