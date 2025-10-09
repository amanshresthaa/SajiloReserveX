# Research: Ops Dashboard — Today’s Bookings

## Existing Capabilities

- Bookings live in `public.bookings`; key fields include `booking_date`, `start_time`, `status`, and `party_size`.
- Existing server utilities (`server/bookings.ts`) handle mutations but no daily summary existed.
- Restaurant metadata contains a timezone (`public.restaurants.timezone`) enabling localised date calculations.
- Policies allow staff roles to view bookings; owners/managers can manage additional artefacts.

## Constraints & Considerations

- Multi-restaurant accounts: initial slice targets the first membership; future work should add switching.
- Timezone handling must rely on restaurant timezone to avoid off-by-one errors; implemented via `Intl.DateTimeFormat`.
- Pending statuses (`pending`, `pending_allocation`) need emphasis; cancellations shouldn’t contribute to cover totals.

## Decision Trace

- Fetch todays bookings using server-side Supabase client to keep logic secured and leverage existing RLS.
- Aggregation occurs in code (counts & covers) to avoid Postgres window complexity for this initial version.
- UI uses existing Shadcn components (cards, badges) for consistency with marketing/admin surfaces.
