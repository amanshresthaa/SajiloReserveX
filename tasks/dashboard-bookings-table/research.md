# Dashboard Bookings Table — Research

## Task Outline & Subtasks

- Inspect existing UI components (shadcn) to reuse for table, badges, skeleton, buttons.
- Confirm React Query wiring and API shape for `/api/bookings?me=1`.
- Identify accessibility/performance considerations for tabular data per sprint rules (focus states, keyboard nav, skeleton).

## Findings

- No existing dashboard table component; must build from scratch using Tailwind + shadcn primitives. `components/ui` includes `badge`, `button`, `skeleton`, etc., which can be repurposed for status chips and placeholders.
- `useBookings` hook will consume the new `/api/bookings?me=1` endpoint returning `{ items, pageInfo }`; hooking into React Query provider added earlier (`AppProviders`).
- Table requirements: columns (Date, Time, Party, Restaurant, Status, Actions), skeleton rows, pagination footer, accessible structure with `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`. Loading state should preserve layout (skeleton). Error state requires inline messaging + retry.
- Need pagination controls with accessible `<nav aria-label="Bookings pagination">`, previous/next buttons, status summary. Use `Button` component with variant adjustments.
- Status chip best implemented with `Badge` and color-coded backgrounds while maintaining contrast.
- Hooks located under `hooks/`; no `useBookings` defined yet. Will create typed hook exporting query result typed to API data.
- `app/(authed)/dashboard/page.tsx` is currently server component with static copy; to integrate hooks we’ll introduce a client wrapper component (either convert page to client or mount a client component within) while preserving layout header from layout.tsx.

## Considerations & Risks

- Ensure query params only include defined filters to avoid duplicate network calls, use `URLSearchParams` built from sanitized object.
- Manage loading vs fetching states to avoid layout jump (`isLoading` for initial, `isFetching` to show subtle overlay/spinner?). We'll show skeleton on first load, and a subtle top progress text for background refetch.
- Must keep pagination state consistent and reset to page 1 when filters change (e.g., when status filter toggles). Provide state management inside view component.
- Handle timezone display: convert ISO to local using `Intl.DateTimeFormat` with options; ensure correct fallback for invalid data.
- Provide keyboard-accessible actions column (for now placeholder button disabled until edit/cancel flows implemented) but maintain semantics.

## Open Questions

- None pending; proceed with implementation using scratch-built components combined with existing shadcn primitives.
