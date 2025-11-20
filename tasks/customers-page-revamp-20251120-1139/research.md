---
task: customers-page-revamp
timestamp_utc: 2025-11-20T11:39:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Customers Page Revamp

## Requirements

- Functional:
  - Revamp `/customers` so restaurant staff can quickly search, filter, and review customer details (name/email/phone/bookings/marketing opt-in) without losing pagination/export.
  - Add filter controls (search, marketing opt-in toggle, recency window, minimum bookings, sort) that drive the server query and export results.
  - Preserve CSV export aligned with current filters and keep pagination smooth with TanStack Query.
- Non-functional (a11y, perf, security, privacy, i18n):
  - WCAG-compliant controls (labels, keyboard focus, visible states) and mobile-first layout.
  - Keep requests efficient (debounced search, paginated with sane defaults) and avoid breaking existing clients (defaults must match current behavior).
  - Enforce membership-based restaurant scoping (no leaking other restaurants) and never expose secrets in UI or code.

## Existing Patterns & Reuse

- Server page: `src/app/app/(app)/customers/page.tsx` prefetches first page using `DASHBOARD_DEFAULT_PAGE_SIZE` and renders `OpsCustomersClient` inside a `HydrationBoundary`.
- Client: `src/components/features/customers/OpsCustomersClient.tsx` uses `useOpsSession`, `Pagination`, `useOpsCustomers`, and `ExportCustomersButton`; no filters besides page/sort default.
- Data: `useOpsCustomers` (TanStack Query) → `CustomerService` (`src/services/ops/customers.ts`) hitting `/api/customers` with params { restaurantId, page, pageSize, sort }.
- API: `src/app/api/ops/customers/route.ts` validates via `schema.ts` then calls `getCustomersWithProfiles` (`server/ops/customers.ts`) which supports pagination + sort only; export route (`/api/customers/export`) uses same data helper.
- UI pieces available: Shadcn `Input/Select/Badge/Button/Popover/Sheet` etc. from `components/ui`, existing `Pagination`, `Alert`, `Skeleton`, `badge` tags on rows, and focus-on-customer behavior via data attributes.

## External Resources

- None yet; relying on in-repo patterns and Shadcn components.

## Constraints & Risks

- Extending filters touches the API schema/service/SQL query—must keep default behavior (desc last visit) to avoid regressions for existing consumers.
- Supabase query will add `ilike`/date filters; risk of slower scans if indices are missing, but page size is capped (<=50). Keep query simple and bounded.
- Export must honor the same filters to avoid mismatched CSV vs. on-screen list.
- Need to maintain membership scoping and avoid letting users supply arbitrary restaurantId via query params.
- Added UI must remain accessible on mobile; complex filter UI could regress keyboard support if not designed carefully.

## Open Questions (owner, due)

- Should filters persist in the URL for shareable views? (Default plan: yes for primary filters like search/marketing/recency to support refresh/back.)
- Are there additional metrics (e.g., lifetime spend) to show? (Not present in current schema—out of scope.)

## Recommended Direction (with rationale)

- Add a structured filter/search bar: text search (name/email/phone), marketing opt-in chip, last-visit window (30/90/365 days/never), minimum bookings threshold, and sort dropdown (recent first/least recent/bookings high→low).
- Extend `CustomerListParams` + API schema/export route + `getCustomersWithProfiles` to accept/handle these filters server-side; keep defaults equivalent to current response.
- Refresh UI framing: heading plus helper text, compact filter bar with clear/reset CTA, table with improved columns (last visit, first visit, bookings/covers), and richer mobile cards with contact chips and quick copy.
- Maintain pagination + focus scrolling; debounce search and show loading/empty/errored states with clear affordances.
