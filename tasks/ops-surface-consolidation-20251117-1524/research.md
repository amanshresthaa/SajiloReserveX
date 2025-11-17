---
task: ops-surface-consolidation
timestamp_utc: 2025-11-17T15:24:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: []
related_tickets: []
---

# Research: Ops surface consolidation (API + UI)

## Requirements

- Functional: unify restaurant-facing APIs under `/api/ops/...` (with canonical `/api/v1/ops/...`), add booking update via `PATCH /api/ops/bookings/[id]`, keep `/api/owner/...` + `/api/team/...` operational by delegating to ops, and align ops UI navigation/flows to the new IA (dashboard/bookings/customers/team/settings).
- Non-functional: maintain backward compatibility while migrating, enforce auth/roles via middleware (`role: "staff" | "owner"`), preserve a11y/perf budgets, and avoid breaking consumers depending on current endpoints/paths.

## Existing Patterns & Reuse

- Ops APIs already exist under `src/app/api/ops` for bookings, customers, restaurants, dashboard, etc.; booking update currently lives at `src/app/api/ops/bookings/[id]/route.ts`.
- Owner/team APIs exist in `src/app/api/owner` and `src/app/api/team` with similar data access patterns.
- UI for ops lives under `src/app/(ops)/ops/(app)` with pages such as bookings dashboard, customer-details, team, and restaurant-settings.
- Middleware (`middleware.ts`) already handles auth redirect and sets deprecation headers for non-`/api/v1` paths.

## External Resources

- None beyond repository codebase.

## Constraints & Risks

- Backward compatibility: adapters for `/api/owner` and `/api/team` must not break existing clients during migration.
- Auth correctness: introducing role-based middleware needs to avoid locking out valid sessions or allowing unauthorized access.
- UI reroutes/redirects could create dead links or SEO issues if not mapped carefully (e.g., `/ops/customer-details` → `/ops/customers/[customerId]`).
- Large surface area increases regression risk; requires clear test coverage and manual QA.

## Open Questions (owner, due)

- Should `/api/ops` and `/api/v1/ops` return identical responses and headers for now (owner: @assistant, due: before implementation)?
- What is the exact owner/team deprecation timeline to communicate in docs/headers (owner: @assistant, due: before release)?
- Are there any third-party consumers of `/api/owner`/`/api/team` requiring special handling (owner: @assistant, due: before rollout)?

## Recommended Direction (with rationale)

- Make `/api/v1/ops/...` the primary implementation and expose `/api/ops/...` as forwarding aliases to avoid breaking callers while signaling deprecation.
- Implement owner/team routes as thin delegates to ops handlers to preserve behavior and reduce duplication during migration.
- Add middleware role checks keyed on user memberships instead of URL prefixes to centralize auth.
- Update ops UI routes and navigation to the new IA with redirects from legacy paths, wiring data fetching exclusively to `/api/ops/...` and preserving existing components where possible.
