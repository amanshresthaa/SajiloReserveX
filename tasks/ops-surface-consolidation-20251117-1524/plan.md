---
task: ops-surface-consolidation
timestamp_utc: 2025-11-17T15:24:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Implementation Plan: Ops surface consolidation

## Objective

Provide a single canonical restaurant-facing surface by consolidating APIs under `/api/v1/ops/...` (with `/api/ops/...` forwarding) and aligning the ops UI/navigation to the new IA without breaking existing `/api/owner` and `/api/team` consumers.

## Success Criteria

- [ ] `/api/v1/ops/{bookings,customers,restaurants,team,dashboard}` implemented; `/api/ops/...` forwards identically.
- [ ] `/api/owner/...` and `/api/team/...` delegate to ops equivalents with parity responses.
- [ ] Role-based middleware enforces `role: "staff" | "owner"` without regressing existing auth flows.
- [ ] Ops UI routes match IA (`/ops`, `/ops/login`, `/ops/bookings`, `/ops/bookings/new`, `/ops/bookings/[bookingId]`, `/ops/customers/[customerId]`, `/ops/team`, `/ops/settings/*`) with redirects from legacy paths.
- [ ] UI wired to `/api/ops/...` only; cross-screen flows (booking→customer, customer→prefilled booking, team invite banner, settings back link) work and are accessible.
- [ ] Tests (unit + integration + E2E happy paths) updated/passing; manual QA artifacts attached.

## Architecture & Components

- **API layer**: New Next.js route handlers under `src/app/api/v1/ops/...` implementing logic or delegating to existing ops modules; `/api/ops/...` routes forward to `/api/v1/ops/...` handlers to keep compatibility.
- **Owner/team adapters**: `/api/owner/...` and `/api/team/...` handlers call into ops handlers/shared service functions to avoid duplication.
- **Middleware**: Add role-based guard using memberships, attach role metadata on request context or headers for downstream handlers.
- **UI pages**: Restructure `src/app/(ops)/ops/(app)` to match IA; add redirects for legacy paths; update navigation component labels/targets.
- **Shared services**: Reuse existing server modules (`server/team/access`, `server/ops/customers`, `server/bookings`, etc.) to power new endpoints and UI data fetching.

## Data Flow & API Contracts

- `/api/v1/ops/bookings`: GET/POST existing logic; add PATCH `/[id]` (canonical) for updates; accepts JSON body matching dashboard schema; returns booking payload with validation headers.
- `/api/v1/ops/customers`: GET list with pagination/sort; future GET `/[id]` for details used by UI (reuse existing customer fetch service if present).
- `/api/v1/ops/restaurants`: GET restaurant(s) for current user membership; may proxy existing owner endpoints.
- `/api/v1/ops/team`: GET/POST invites/members mapping to team services; `/[id]` if needed.
- `/api/v1/ops/dashboard`: summary metrics for ops home; reuse existing dashboard endpoint.
- `/api/ops/...`: forwards to `/api/v1/ops/...` preserving method, body, headers, and response.
- `/api/owner/...`, `/api/team/...`: delegate to ops handler/service with consistent status codes and response shapes; mark deprecation headers.

## UI/UX States

- `/ops`: dashboard landing; shows metrics and navigation.
- `/ops/bookings`: list; links to `/ops/bookings/[bookingId]`; CTA to `/ops/bookings/new`.
- `/ops/bookings/new`: booking creation form; prefill when navigating from customer profile.
- `/ops/bookings/[bookingId]`: detail/edit using PATCH endpoint.
- `/ops/customers/[customerId]`: profile with link back to bookings + CTA to create booking with prefilled customer.
- `/ops/team`: manage members/invites; show success banner and copy link on invite creation.
- `/ops/settings/restaurant` and `/ops/settings/service-periods`: forms with “Back to dashboard” control.
- Redirect `/ops/customer-details` → `/ops/customers/[customerId]` (or list) with preserved query params when possible.

## Edge Cases

- Missing or multiple restaurant memberships: default to first; forbid access to unauthorized restaurant IDs.
- Booking updates for past bookings require admin override; honor existing validation rules.
- Downgrade/expired sessions should redirect to login without leaking resource existence.
- Forwarding/alias routes must preserve headers (Deprecation/Sunset) and HTTP status.
- Prefill flows should resist undefined customer data; handle missing phone/email gracefully.

## Testing Strategy

- Unit: API handler parameter parsing/validation, role guard utility, forwarding adapters.
- Integration: Booking PATCH path (happy/error), customer profile fetch, owner/team adapter calls.
- E2E (Playwright): ops auth + booking flow, booking→customer navigation, customer→prefilled booking, team invite banner copy, settings back navigation.
- Accessibility: axe on ops key pages; keyboard navigation through nav/CTAs/forms.

## Rollout

- Feature flag: consider `feat.ops.ia-alignment` guarding new UI routes if risk warrants; default on once verified.
- Exposure: internal/staged first, then 100% after automation passes.
- Monitoring: observability events via existing `recordObservabilityEvent`; add telemetry for key flows (e.g., `ops_view_dashboard`, `ops_create_booking`, `ops_update_booking_status`, `ops_invite_team_member`).
- Kill-switch: rollback to previous nav via env flag or revert; keep `/api/owner`/`/api/team` adapters until removal date.

## DB Change Plan (if applicable)

- No schema changes anticipated. If needed later, follow staging-first with PITR references and attach diffs in `artifacts/db-diff.txt`.
