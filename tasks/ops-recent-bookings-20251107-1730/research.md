# Research: Ops “Recent” Bookings View

## Requirements

- Add a “Recent” option on `/ops/bookings` that surfaces the newest bookings first (“most recent created bookings on top”).
- Respect existing filters (restaurant scoping, status filters, pagination).
- Keep data sorted server-side so pagination reflects recency ordering.

## Existing Patterns & Reuse

- `useOpsBookingsTableState` already centralizes list filters (status tabs, pagination, query) and controls the `sort` direction sent to `useOpsBookingsList`.
- `/api/ops/bookings` accepts `sort=asc|desc` and currently orders on `start_at`.
- `BookingsTable` renders status tabs via `StatusFilterGroup` but does not yet expose configurable options per consumer.

## Observations

- Ops users also have a multi-select `OpsStatusFilter` popover for detailed status filtering; the top-level tabs mainly control time windows (`upcoming`, `past`, `cancelled`, `all`).
- The API schema already includes a `sort` parameter; adding a `sortBy`/`orderBy` parameter is straightforward to avoid overloading start-time ordering.
- Supabase `bookings` rows include `created_at`, so ordering by creation timestamp is possible without schema changes.

## Constraints & Risks

- Need to keep guest “My Bookings” view unchanged; the new option should only appear on the Ops page.
- Query params (`filter=`) are persisted in URLs, so we must allow `filter=recent`.
- Pagination metadata must remain accurate when ordering by `created_at`.

## Recommended Direction

- Introduce a `sortBy` filter plumbed through `OpsBookingsFilters` → query string → API schema.
- Extend `StatusFilter`/`OpsStatusFilter` unions with `'recent'` and handle it in `useOpsBookingsTableState` (set `sort='desc'`, `sortBy='created_at'`, no date range).
- Update `/api/ops/bookings` to select `created_at` and honor the requested order column.
- Make `BookingsTable` accept custom `statusOptions` so Ops can inject the new tab without impacting the customer portal; pass `[...defaultOptions, { value: 'recent', label: 'Recent' }]` from `OpsBookingsClient`.
