---
task: customers-page-revamp
timestamp_utc: 2025-11-20T11:39:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Customers Page Revamp

## Objective

We will enable restaurant staff to efficiently view, filter, and act on customer records so that they can handle service and outreach quickly.

## Success Criteria

- [ ] Customer list and CSV export both respect search/marketing/recency/min-bookings filters, with defaults matching today (last visit desc, page 1, page size 10) when filters are cleared.
- [ ] UX is keyboard-accessible and mobile-friendly: all filter controls focusable with visible outlines, empty/error/loading states present, and no console errors during manual QA.

## Architecture & Components

- Data/query: extend `CustomerListParams`, `queryKeys.opsCustomers.list`, and `useOpsCustomers` to include filters { search, marketingOptIn, lastVisit, minBookings, sortBy, sortDirection } with debounced search and stable cache keys.
- API: update `opsCustomersQuerySchema`, `/api/ops/customers`, and `getCustomersWithProfiles` to apply ilike search over name/email/phone, marketing opt-in boolean filter, last-visit windows (30/90/365 days or never), minimum bookings, and sorting (last visit or bookings, asc/desc). Keep default current behavior when params absent.
- Export: reuse the same validated filters in `/api/customers/export` so CSV matches the on-screen query.
- UI shell: enhance `OpsCustomersClient` with a filter bar (search input, marketing chip, last-visit select, min-bookings select, sort dropdown, clear-all) plus refreshed header/actions. Sync primary filters to URL via `useSearchParams` for refresh/share persistence and reset on restaurant switch.
- Presentation: refresh `CustomersTable` mobile cards + desktop table to show clearer contact info, visit cadence labels, marketing badges, and quick copy actions; keep pagination + focus-on-customer behavior.

## Data Flow & API Contracts

Endpoint: GET `/api/ops/customers` (and `/api/v1/ops/customers` alias)
Query params:

- `restaurantId` (uuid, required)
- `page` (int >=1, default 1)
- `pageSize` (int 1-50, default 10)
- `search` (string, optional; matches name/email/phone via ilike)
- `marketingOptIn` (`all`|`opted_in`|`opted_out`, default `all`)
- `lastVisit` (`any`|`30d`|`90d`|`365d`|`never`, default `any`)
- `minBookings` (int >=0, default 0)
- `sortBy` (`last_visit`|`bookings`, default `last_visit`)
- `sort` (`asc`|`desc`, default `desc`)
  Response: existing `OpsCustomersPage` (items + pageInfo), unchanged shape.
  Errors: validation 400, forbidden 403, auth 401, server 500 with logged context.
  Export: GET `/api/ops/customers/export` accepts the same query params and returns CSV filtered identically.

## UI/UX States

- Loading: skeleton rows, disabled export/actions, filter controls show spinner where applicable.
- Empty: guidance message with “adjust filters” hint and clear CTA.
- Error: inline alert with retry button; preserve current filter state.
- Success: table/cards with contact chips, marketing badges, visit recency text; active filter pills + clear-all button.
- Focus scroll: maintain support for `?focus=<customerId|email>` using data attributes.

## Edge Cases

- No memberships → keep “No restaurant access” state.
- Restaurant switch resets page to 1 and clears incompatible filters; disallow arbitrary restaurantId in URL if not in memberships.
- Null last booking dates (never visited) should still appear and respect “never” filter/sort.
- Invalid/unknown query params fall back to defaults via schema parsing without throwing client errors.

## Testing Strategy

- Unit: add coverage for query param building/normalization (e.g., search params builder used by customer service) and date window helper. Expand schema test for `opsCustomersQuerySchema` if feasible.
- Manual: exercise filter combinations, pagination, export, and focus scroll; verify keyboard navigation + screen-reader labels.
- Automated suites: run `pnpm lint` and a focused `pnpm test --filter useOpsCustomers` if applicable (or nearest lightweight scope) to catch regressions.
- Accessibility: axe/DevTools pass during manual QA.

## Rollout

- No new feature flag; change ships guarded by membership checks already in place.
- Rollout via normal deploy; monitor server logs for `/api/ops/customers` errors and client console for UI regressions. Revert via rollback if needed.

## DB Change Plan (if applicable)

- No DB schema changes planned; only query filters on existing tables.
