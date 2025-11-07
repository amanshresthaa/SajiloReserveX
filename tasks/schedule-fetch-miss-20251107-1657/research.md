# Research: Schedule Fetch Misses on Reserve Flow

## Requirements

- Functional: Investigate why `/reserve/r/white-horse-pub-waterbeach` triggers `schedule.fetch.miss` events for `restaurantSlug: 'demo-restaurant'` and API 404s, then fix the underlying issue so schedule requests use the correct slug.
- Non-functional: Respect AGENTS.md SDLC (remote-only Supabase access, document evidence), avoid regressing existing wizard draft behavior, and keep UX smooth (no unnecessary alerts).

## Existing Patterns & Reuse

- `useReservationWizard` loads/saves drafts through `useWizardDraftStorage` helpers. Draft hydration currently ignores the active restaurant context.
- `BookingFlowPage` already passes `initialDetails` with the route's slug (`white-horse-pub-waterbeach`) into the wizard.
- `analytics.emit('schedule.fetch.miss', { restaurantSlug, date })` in `usePlanStepForm` shows the slug the wizard thinks it’s using.

## External Resources

- Supabase CLI verification (remote only per AGENTS.md):  
  `supabase inspect db table-stats --db-url "$SUPABASE_DB_URL"` → `public.restaurants` estimated row count `1`. Confirms only White Horse Pub data exists remotely; any `demo-restaurant` request will 404.

## Constraints & Risks

- Drafts are stored in `localStorage` under a single key (`reserve.wizard.draft`). Hydrating a draft from a different restaurant overwrites the current slug, breaking schedule/API calls.
- Need backwards compatibility with existing drafts so we don’t lose customer progress when they return to the same restaurant.
- Must avoid leaking secrets while interacting with Supabase CLI.

## Open Questions (owner, due)

- Should we migrate legacy drafts to per-slug storage or just discard them? (Tentative: migrate opportunistically, otherwise clear.)
- Any UX messaging required when discarding drafts due to slug mismatch? (Will add subtle alert only when needed.)

## Recommended Direction (with rationale)

- Update `useWizardDraftStorage` to namespace drafts by `restaurantSlug` (e.g., `reserve.wizard.draft.<slug>`). This prevents cross-restaurant contamination going forward.
- When loading drafts, accept an optional expected slug:
  - First try slug-specific key.
  - Fall back to the legacy key; if slug mismatch, discard and clear.
- In `useReservationWizard`, pass the active slug to `load/save/clear` helpers and surface a gentle alert if we drop a stale draft.
- Result: schedule fetches stay aligned with the viewed restaurant, avoiding 404 spam without impacting users booking repeatedly at the same venue.
