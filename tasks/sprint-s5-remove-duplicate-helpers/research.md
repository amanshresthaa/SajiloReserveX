# Sprint S5 — Remove Duplicate Helpers: Research

## Direction

- Target leftover helper/utility implementations that duplicate logic now provided by shared modules introduced in S1–S4.
- Confirm scope includes server/API/email layers in addition to UI so we consolidate time/date formatting and normalization everywhere.

## Findings

### 1. API route duplication (`app/api/bookings/[id]/route.ts`)

- Local `normalizeTimeFragment` slices raw strings to `HH:MM` (line ~118). Equivalent behaviour available via `normalizeTime` + `toReservationTime` in `@reserve/shared/time`.
- Route recomputes `startTime`/`endTime` via `new Date(...).toTimeString().slice(0,5)` (lines ~132–134). Could reuse shared formatting or minute conversion helpers to avoid ad-hoc slicing.

### 2. Email formatting duplication (`server/emails/bookings.ts`)

- Defines `formatDate`, `formatTime`, `formatDateFromDate`, `formatTimeFromDate`, and `normalizeTimeString`. All mirror functionality now provided by `@reserve/shared/formatting/booking` + `@reserve/shared/time`.
- Uses bespoke Intl formatter construction four times with identical config (lines 9, 44, 53, 64). Shared formatter cache can replace these copies for consistency.
- `parseTimestamp` replicates safe parsing that might now map to future shared functions (validate whether we need a helper or can reuse `createDateFromParts` / `toDateMidnight`).

### 3. Misc string slicing patterns

- Found `toTimeString().slice(0, 5)` in dashboard update flow (same API file). Should transition to branded time helpers to enforce consistent typing.

### 4. Remaining aggregates

- `reserve/shared/utils/booking.ts` now only re-exports `storageKeys` and `BookingOption` with a deprecation banner—confirms migration success; no additional helper logic to retire here.

## Verification

- `rg` for `normalizeTime` showed two bespoke implementations (API + email) still present.
- `rg "Intl.DateTimeFormat(\"en-GB\""` highlighted repeated formatter definitions in emails.
- `pnpm test` and `pnpm lint` currently pass (lint leaves pre-existing useCallback dependency warnings outside our touched scope) ensuring baseline stability before refactor.

## Risks / considerations

- Server/email contexts must remain tree-shakeable & avoid bundling client-only code; ensure shared modules we import stay runtime-safe (no `window` access).
- Need to confirm timezone requirements: emails currently honour `DEFAULT_VENUE.timezone`, while shared formatters default to config timezone. May require dependency injection or additional helper for arbitrary timezones.
- `normalizeTimeString` in emails accepts loosely formatted inputs; verify shared normalization handles same cases or add adaptation.

## Next steps

- Draft plan to replace API + email helpers with shared utilities, possibly extending shared modules to support timezone overrides where needed.
- Add tests to cover refactored server/email paths if not already present (e.g., snapshot of email summary output using shared helpers).
