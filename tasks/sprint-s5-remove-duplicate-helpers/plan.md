# Sprint S5 — Remove Duplicate Helpers: Plan

## Objective

Remove redundant helper logic that still lives outside the shared modules, ensuring all layers rely on the centralised time/formatting utilities introduced in earlier sprints.

## Scope

- API route `app/api/bookings/[id]/route.ts`
- Email rendering `server/emails/bookings.ts`
- Any additional hot paths uncovered while replacing the above (run `rg` checks afterward to confirm no stray helpers remain).

## Plan

1. **API route cleanup**
   - Replace `normalizeTimeFragment` with `normalizeTime`/`toReservationTime` from `@reserve/shared/time` (handle nullability).
   - Remove manual `toTimeString().slice(0, 5)` conversions by using shared helpers (`formatDateForInput`, `fromMinutes`, or `formatReservationTime` depending on required output).
   - Ensure any Zod schemas or downstream calls still receive the expected string formats; add unit or integration coverage if missing.

2. **Email helper consolidation**
   - Swap local `formatDate`, `formatTime`, `normalizeTimeString`, `formatDateFromDate`, `formatTimeFromDate` with shared alternatives.
   - If emails require arbitrary timezone support (e.g., DEFAULT_VENUE time zone), extend shared formatter API to accept a timezone override or expose a variant that accepts config.
   - Remove duplicate regex/time parsing once shared utilities cover those cases.

3. **Shared module enhancements (if necessary)**
   - Add optional timezone parameters or additional guards to shared formatting functions when migrating server/email usage.
   - Provide helper to format Date objects directly if current API only accepts strings.

4. **Verification & cleanup**
   - Run `rg` for `normalizeTimeFragment`, `normalizeTimeString`, `toTimeString().slice(0, 5)` to confirm removal.
   - Execute `pnpm test` and `pnpm lint`.
   - Add/update tests: cover email summary formatting and API time normalization if not present.

## Open questions

- Do emails need locale flexibility beyond `en-GB`? (Current implementation hardcodes; assume no change unless specified.)
- Should shared helpers return branded types in server contexts or plain strings? For now, plan to use string outputs consistent with existing behaviour.
