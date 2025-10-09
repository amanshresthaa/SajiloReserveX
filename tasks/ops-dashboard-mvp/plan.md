# Implementation Plan: Ops Dashboard MVP

## Objective

Deliver a richer `/ops` dashboard that equips restaurant teams with actionable same-day reservation data, including expanded metrics, status filters (All / Upcoming / Show / No show), past-start alerts, and detailed booking drill-downs, while preserving existing auth safeguards and timezone accuracy.

## Success Criteria

- [ ] Unauthenticated requests redirect to `/signin?redirectedFrom=/ops`.
- [ ] Authenticated users with at least one membership see expanded summary metrics and schedule sourced from Supabase.
- [ ] Cover totals exclude cancelled and no-show bookings; counts align with Supabase data per status bucket.
- [ ] Restaurant timezone drives “today” calculations; summary date and times match the local service day.
- [ ] Invite-needed state displays when memberships are absent; empty-state copy appears when no bookings (or no filtered bookings) exist.
- [ ] Users can filter bookings with accessible controls for `All`, `Upcoming`, `Show`, and `No show`.
- [ ] Schedule displays customer, start/end time, guest count, notes preview, status, and a “Details” action exposing contact/reference data.
- [ ] Bookings whose start time has passed but are still pending/confirmed are flagged for follow-up.
- [ ] Tests cover summary aggregation (including new fields) and timezone handling; verification doc captures automated + manual outcomes.

## Architecture

### Components & Modules

- `app/(ops)/ops/page.tsx`: server component responsible for auth, membership resolution, summary fetch, and layout framing.
- `server/ops/bookings.ts`: `getTodayBookingsSummary` supplies timezone-aware booking data plus richer fields (contact info, references, details).
- `components/ops/dashboard/TodayBookingsCard.tsx`: client component rendering metrics, status filters, responsive schedule (mobile cards + desktop table), and detail dialogs.
- `app/api/ops/bookings/[id]/status/route.ts`: lightweight PATCH endpoint for toggling bookings between show/no-show states with membership verification.
- Shared utilities: `getServerComponentSupabaseClient`, `fetchUserMemberships`, `getDateInTimezone`, `formatReservationTime`, SHADCN primitives (`card`, `toggle-group`, `dialog`, `button`, `badge`).

### State Management & Data Flow

1. Server component resolves Supabase session; redirects if user absent.
2. Fetch memberships via `fetchUserMemberships`.
3. Select first membership (MVP decision) to determine primary restaurant; capture restaurant name for display.
4. Invoke `getTodayBookingsSummary(restaurantId, { client: supabase })` to fetch bookings for the restaurant-local “today”.
5. Pass summary + restaurant metadata into `TodayBookingsCard`.
6. Within the client component, manage filter state (`all | upcoming | show | no-show`), derive filtered bookings, surface past-start alerts, and open dialogs per booking as needed.

### API Contracts

```
type TodayBooking = {
  id: string;
  status: Tables<"bookings">["status"];
  startTime: string | null;
  endTime: string | null;
  partySize: number;
  customerName: string;
  notes: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  reference: string | null;
  details: Tables<"bookings">["details"] | null;
};

type TodayBookingsSummary = {
  date: string;       // YYYY-MM-DD in restaurant timezone
  timezone: string;
  restaurantId: string;
  totals: {
    total: number;
    confirmed: number;
    completed: number;
    pending: number;
    upcoming: number;
    cancelled: number;
    noShow: number;
    covers: number;   // excludes cancelled + no_show
  };
  bookings: TodayBooking[];
};
```

### UI/UX Considerations

- Mobile-first: stacked layout with horizontal scroll table only on md+; mobile uses cards with definition lists.
- Metrics grid includes Total, Upcoming, Show, No shows, Cancelled, Covers (icons for key stats).
- Filter controls use `ToggleGroup` with accessible labelling; visual feedback for current selection.
- Desktop schedule uses semantic `<table>` with sticky header inside a scroll container; mobile cards mirror same info.
- Status badges retain colour semantics; `no_show` emphasised via destructive badge.
- “Details” button launches a dialog summarising status, timing, party size, contact info, notes, and raw `details` JSON (formatted).
- Past-start bookings surface inline attention chips with contextual messaging.
- Empty/filter-empty states communicate clearly and offer a reset action for filters.
- Maintain focus rings, keyboard navigation, and ARIA labelling (e.g., dialog titles, separators with `aria-hidden`).

## Implementation Steps

1. **Extend Summary Query**
   - Update `server/ops/bookings.ts` select to include `customer_email`, `customer_phone`, `reference`, `details`.
   - Map new fields onto `TodayBooking`; expand totals to track upcoming, completed, and no-show counts alongside existing buckets.
2. **Dashboard Copy & Error Handling**
   - Confirm server page logs errors and renders fallback alert; copy remains relevant post-redesign.
3. **Rebuild `TodayBookingsCard`**
   - Add metrics grid items for upcoming/show/no-show; implement multi-option filter toggle group.
   - Render responsive schedule (desktop table + mobile cards) with additional columns/fields.
   - Highlight past-start bookings with attention badges and guidance.
   - Wire “Details” dialog showing comprehensive booking info and show/no-show confirmation flows.
   - Handle empty/filter-empty states and maintain responsive spacing.
4. **Testing**
   - Update `tests/server/ops/getTodayBookingsSummary.test.ts` to reflect new fields and ensure timezone + totals remain correct.
5. **Documentation & Verification**
   - Update `todo.md` progress, `verification.md` with command results and pending manual QA.

## Edge Cases

- No session ⇒ redirect.
- No memberships ⇒ invite-needed state.
- No bookings today ⇒ empty schedule message.
- Filter results empty ⇒ show guidance + reset control.
- Supabase errors ⇒ log and show alert; card omitted.
- Restaurant timezone missing ⇒ fallback to UTC.
- Null `start_time`/`end_time`/contact fields ⇒ display placeholders (`Time TBC`, `—`, `Not provided`).
- Past-start bookings when timezone differs from browser clock ⇒ rely on timezone-aware comparisons to avoid false positives.
- Large/complex `details` JSON ⇒ render collapsed code block with scroll.

## Testing

- Node `node:test` suite covering aggregation and payload mapping (`tests/server/ops/getTodayBookingsSummary.test.ts` via `tsx --test`).
- Linting via `pnpm lint`.
- Manual QA: toggle filters, open dialogs, check keyboard traversal, verify responsive layouts with seeded data.
- Document `pnpm test` status (noting known unrelated failures) and alternative targeted test command.

## Rollout

- No feature flag; incremental UI update on existing `/ops`.
- Ensure seed data includes bookings with varied statuses for manual QA; note in verification if adjustments made.
- Monitor logs for repeated Supabase summary errors post-deploy.

## Open Questions

- Should filter selections persist across sessions/URL (future enhancement)?
- Need dedicated styling for cancelled rows beyond badge (e.g., muted text)? pending design direction.
- Any additional metrics (e.g., revenue) required for near-term roadmap?
