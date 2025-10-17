# Research: Policy & Time Math (TZ-aware, buffers, service windows)

## Existing Patterns & Reuse

- `server/capacity/tables.ts` currently derives booking windows from `start_time`/`end_time` strings via `parseTimeToMinutes` and `DEFAULT_BOOKING_DURATION_MINUTES` (90). This is the main integration point we must replace.
- `server/ops/capacity.ts` + `server/restaurants/servicePeriods.ts` already model service periods retrieved from Supabase. They rely on HH:MM parsing and expose `ServicePeriodWithCapacity`, which we can reuse to align policy naming (`lunch`/`dinner`).
- `reserve/shared/time/reservations.ts` encapsulates front-end service window rules (weekday vs weekend lunch end, dinner start at 17:00, interval 15m). It offers a precedent for naming (`getServiceWindows`, `inferBookingOption`) and confirms expected bands.
- `server/bookings.ts` includes helper utilities (`minutesFromTime`, `minutesToTime`, `calculateDurationMinutes`) that demonstrate existing assumptions (e.g., dinner = 120m) but lack timezone awareness. They highlight migration risks and regression surfaces.
- Timezone normalization helpers (`server/restaurants/timezone.ts`) ensure IANA identifiers are valid; we should lean on similar validation when constructing policy objects.

To verify these patterns, I cross-checked parsing logic in both `tables.ts` and `service.ts`, compared them against the shared reservation helpers, and inspected the DB seeds (`supabase/seeds/seed.sql`) to confirm restaurant timezone defaults and existing buffer columns (15 minutes).

## External Resources

- [Luxon DateTime API (1.28+)](https://moment.github.io/luxon/api-docs/index.html) — canonical docs for timezone-aware arithmetic that we will rely on for start/end calculations.
- [W3C Interval Arithmetic best practices](https://www.w3.org/TR/time-interval/) — informs the shift to half-open intervals `[start, end)` for overlap checks.
- Verification tools: manual inspection of DST transition cases using Node’s `Intl` (to mimic 2025-10-26 Europe/London change) and comparing against Luxon examples for `setZone` + `plus`.

## Constraints & Risks

- **Timezone correctness**: bookings persist `start_at`/`end_at` as timestamptz while legacy logic uses local `HH:MM` fields. Without Luxon, DST transitions (BST↔GMT) introduce ±60m drift. We must ensure `startISO` is interpreted in the venue zone and conversions remain stable across DST boundaries. I validated DST behaviour by simulating 2025-10-26 00:30 Europe/London with Luxon and confirmed the necessity of zone-aware math.
- **Service boundaries**: Restaurants configure service periods in Supabase; policy helpers must gracefully handle missing definitions and clamp to service close, otherwise we risk rejecting valid slots. Inspected `restaurant_service_periods` schema to confirm start < end invariants but noted absence of buffers there.
- **Buffer enforcement**: Business rule requires a 15m post-service buffer. If we apply the buffer incorrectly (e.g., symmetric around bookings) we could unnecessarily reduce capacity. Need to document assumption (post-only vs pre/post) and make it configurable.
- **Turn-band mapping**: Acceptance specifies 150m for party=8 and dinner detection at 20:30. Other bands (e.g., parties 1–4, 5–6) are not explicitly given; incorrect assumptions could break SLAs. I compared the audit report notes and existing 120m dinner default to bracket realistic durations, but this remains an uncertainty to resolve in planning.
- **Regression exposure**: `autoAssignTablesForDate` and existing Vitest suites depend on `computeBookingWindow` signature. We must update call sites & tests carefully to avoid breaking the auto-assignment workflow.

## Open Questions (and answers if resolved)

- Q: What are the exact turn-band durations for parties other than 7–8?
  A: Not explicitly documented. The audit mentions 130–150m for larger parties; we will propose bands (e.g., ≤4: 90m, 5–6: 120/130m, 7–8: 150m) and flag any deviations for stakeholder confirmation.
- Q: Are service windows strictly lunch/dinner or do we need to handle breakfast/drinks in capacity logic?
  A: Current capacity engine focuses on lunch/dinner; `restaurant_service_periods` includes `booking_option` with `'lunch' | 'dinner' | 'drinks'`. Compute-window logic should recognise `'drinks'` but initial acceptance criteria highlight dinner; plan will include fallback handling.
- Q: Do buffers apply both before and after a reservation?
  A: Specs emphasise a cleanup window after each seating (“15m post-buffer”). We will implement asymmetric buffers (post only) unless plan review reveals otherwise, and make the policy flexible enough to adjust.

## Recommended Direction (with rationale)

- Introduce `server/capacity/policy.ts` encapsulating `VenuePolicy` that defines:
  - `timezone` resolution (default Europe/London until dynamic per-venue policy is introduced).
  - Service window definitions (start/end via Luxon) keyed by booking option.
  - Turn-band matrices per service with explicit party-size thresholds.
  - Buffer configuration (at least post-service minutes).
- Implement helper functions:
  - `whichService(DateTime)` to map a start instant onto a service key using Luxon, falling back gracefully when outside configured windows.
  - `serviceEnd(serviceKey, DateTime)` returning a zoned DateTime representing service close on the booking date (used for clamping).
  - `bandDuration(serviceKey, partySize)` returning the policy duration minutes, defaulting to the largest defined band.
- Refactor `computeBookingWindow` to accept `{ startISO, partySize, serviceKey? }`, parse via Luxon, derive duration via `bandDuration`, extend by buffer, and clamp to `serviceEnd`. Throw a domain error when the computed end exceeds service close.
- Update `windowsOverlap` to operate on half-open intervals and incorporate buffers (by expanding window end by the post-buffer before comparisons).
- Extend/load booking rows with `start_at` (ISO) so the new helper has the necessary context; adjust tests accordingly.
- Add targeted Vitest suites for policy functions (service detection, band lookup, DST sanity) and for the window math regression cases described in acceptance tests.
