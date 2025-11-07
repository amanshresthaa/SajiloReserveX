# Implementation Plan: Schedule Fetch Misses on Reserve Flow

## Objective

Ensure the reservation wizard always requests schedules for the restaurant the user is viewing by isolating drafts per slug and guarding against stale cross-restaurant data hydration.

## Success Criteria

- [ ] Visiting `/reserve/r/<slug>` no longer emits `schedule.fetch.miss` events referencing `demo-restaurant`.
- [ ] `/api/restaurants/<slug>/schedule` returns 200 for seeded dates when the wizard prefetches (no 404 spam).
- [ ] Existing drafts for the same slug continue to load; drafts for other slugs are discarded/reset with a recorded analytics reason.

## Architecture & Components

- `reserve/features/reservations/wizard/hooks/useWizardDraftStorage.ts`
  - Introduce slug-aware storage helpers: `loadWizardDraft(slug?)`, `saveWizardDraft(details)`, `clearWizardDraft(slug?, { includeLegacy?: boolean })`.
  - Persist drafts under `reserve.wizard.draft.<slug>` and keep compatibility with the legacy global key.
- `reserve/features/reservations/wizard/hooks/useReservationWizard.ts`
  - Determine the active slug from `initialDetails` (fall back to runtime default).
  - Pass the slug into load/save/clear helpers.
  - When a legacy draft slug mismatches the active slug, clear it, raise `planAlert`, and emit `wizard.reset.triggered` with reason `slug-mismatch`.

## Data Flow & API Contracts

- `localStorage` now stores one draft per slug; payload shape remains the same (`BookingDetails` snapshot).
- Analytics events gain optional `fromSlug` / `toSlug` metadata for observability.

## UI/UX States

- The Plan step may show an info alert ("Let’s refresh availability…") only when a mismatched draft is cleared—reuse existing `setPlanAlert` messaging.
- No visual changes otherwise.

## Edge Cases

- Users without an active slug (e.g., legacy `/reserve` entry) should still function via fallback slug.
- Handle missing or malformed stored drafts gracefully; don’t crash if JSON is invalid.
- Ensure drafts expire and clear per slug as before.

## Testing Strategy

- Unit-ish: rely on existing hooks/components; add regression coverage if feasible (time permitting) or at least manual smoke via:
  - Load `/reserve/r/white-horse-pub-waterbeach`, confirm network requests hit same slug.
  - Simulate legacy draft by seeding `localStorage` with `reserve.wizard.draft` for another slug and verify it’s cleared.
- Run `pnpm exec eslint reserve/features/reservations/wizard/hooks/useReservationWizard.ts reserve/features/reservations/wizard/hooks/useWizardDraftStorage.ts --max-warnings=0`.

## Rollout

- No flags required. Once merged, stale drafts auto-clear on next visit.
