# Research: Booking Validation Unification

## Existing Patterns & Reuse

- `server/booking/BookingValidationService.ts` already encapsulates schedule, past-time, override, and capacity preflight logic. I confirmed via `sed -n '1,520p' server/booking/BookingValidationService.ts` that it normalises dates, maps `OperatingHoursError`/`PastBookingError`, and exposes `createWithEnforcement` / `updateWithEnforcement`, but those methods currently rely on a not-yet-implemented `capacityService.updateBooking`.
- `server/booking/types.ts` defines the unified DTOs (`BookingInput`, `BookingError`, `BookingValidationResponse`, `ValidationContext`, etc.). The file was checked with `sed -n '1,200p' server/booking/types.ts` and aligns with the contract outlined in the task brief (codes, override metadata, type-safe context).
- The customer `/api/bookings` route (`src/app/api/bookings/route.ts`) still performs inline validation (schedule fetch, `assertBookingWithinOperatingWindow`, `assertBookingNotInPast`, `createBookingWithCapacityCheck`). None of the new service APIs are invoked—verified with `rg "BookingValidationService" src/app/api -n`, which returned no call sites.
- Dashboard edit route (`src/app/api/bookings/[id]/route.ts`) only checks past-time (if flag enabled) before `updateBookingRecord`, leaving schedule/closure/capacity unchecked (verified by reading lines 60–210 via `sed`).
- Ops edit (`src/app/api/ops/bookings/[id]/route.ts`) and Ops walk-in create (`src/app/api/ops/bookings/route.ts`) mirror the dashboard shortcut, with additional policy validation via `validateBookingWindow`, but still bypass live schedule closures and transactional capacity enforcement.
- Capacity module (`server/capacity/transaction.ts`) offers `createBookingWithCapacityCheck` but lacks an equivalent update path. `rg "updateBookingWith" server/capacity` returned no matches, confirming the need for a new RPC/wrapper.
- Feature flag plumbing already exposes `env.featureFlags.bookingValidationUnified` (checked in `lib/env.ts:113-132` and `config/env.schema.ts:42`), but no runtime branches consume it yet (`rg "bookingValidationUnified" -n` returns only these definitions and task docs).

## External Resources

- `tasks/booking-validation-unification-20251021-1412/*` — prior research/plan iterations documenting desired architecture, risks, and rollout sequencing.
- `tasks/booking-crud-audit-20251021-1339/research.md` — holistic audit of current CRUD gaps (capacity, overrides, schedule parity).
- `server/capacity/README.md` and `server/capacity/service.ts` — describe capacity check semantics, error codes, and slot calculations we must reuse.
- `tasks/prevent-past-bookings-20251015-1323/*` — rollout notes for past-time blocking and override telemetry; informs compatibility requirements.
- `/reserve` wizard code (`reserve/features/reservations/wizard/**/*`) — the current “gold standard” client behaviour we must mirror for dashboards/Ops.

## Constraints & Risks

- **Transactional updates**: `BookingValidationService.updateWithEnforcement` expects a transactional capacity update RPC. Until we supply `capacityService.updateBooking`, updates cannot be safely refactored.
- **Override governance**: Service requires `ctx.actorCapabilities` to include `booking.override`. We must ensure Ops auth stack can populate this capability and collect `override.reason`; otherwise validation will hard-fail overrides.
- **Legacy contract compatibility**: Existing routes return heterogeneous HTTP statuses (400/409/422) and payload shapes. Switching to the unified `BookingValidationResponse` must be feature-flagged (`bookingValidationUnified`) with fallbacks to avoid breaking clients mid-rollout.
- **Timezone correctness**: Dashboards submit ISO strings in browser TZ. We must reliably convert to restaurant TZ before validation to avoid false positives, especially around DST boundaries (see `lib/utils/datetime.ts` helpers).
- **Capacity source of truth**: Ops routes currently bypass the capacity module entirely and insert directly via `insertBookingRecord`. Replacing this logic requires ensuring Supabase RPCs (insert/update) match needed fields (client request ids, audit metadata) or we risk regressions.
- **Telemetry expectations**: Observability events today (e.g., `booking.past_time.blocked`) are triggered from multiple routes. Consolidation must maintain or extend these signals to avoid monitoring blind spots.
- **Supabase migrations**: Adding an update RPC touches remote DB only (per AGENTS.md). Need coordination to ship migration separately, and local tests must stub capacity update behaviour.

## Open Questions (and answers if resolved)

- Q: Does a capacity-aware update RPC already exist in Supabase?  
  A: No. `rg "update_booking" supabase/migrations supabase/functions` returned nothing, confirming we must author a new RPC and client wrapper.
- Q: How should override audits be persisted?  
  A: `logAuditEvent` (see `server/bookings.ts:248-270`) accepts arbitrary JSON metadata. We can extend the payload with `override_codes`, `override_reason`, and actor/context without schema changes.
- Q: Can dashboard/Ops contexts supply the `booking.override` capability today?  
  A: Not directly; current guards check restaurant memberships (`fetchUserMemberships`, `requireMembershipForRestaurant`) but do not expose capability lists. We may derive capabilities from roles (e.g., map manager/owner -> capability) or extend guard responses; needs confirmation during implementation.
- Q: Do clients rely on specific HTTP codes (e.g., 422 for past-time)?  
  A: Dashboard and Ops UIs expect 422 for past-time and 429 for rate limit (checked in `reserve/features` hooks and Ops client fetchers). During rollout we must either preserve codes via mapper or gate new responses behind the feature flag.
- Q: Are there shared helpers to transform ISO strings into restaurant-local date/time?  
  A: `lib/utils/datetime.ts` exports `zonedTime`, `parseUtcToZoned`, etc. Verified with `rg "parseUtcToZoned" -n` which shows usage in waiter dashboards; we should reuse to minimise bugs.

## Recommended Direction (with rationale)

- Finish `BookingValidationService` dependencies: supply a `ScheduleRepository` implementation (wrapping `getRestaurantSchedule`) and a `CapacityService` with both `checkAvailability` and new transactional `create/update` operations. This preserves current `/reserve` correctness while enabling reuse.
- Introduce an adapter layer for each API route (`/api/bookings`, `/api/bookings/[id]`, `/api/ops/bookings`, `/api/ops/bookings/[id]`) that, when `env.featureFlags.bookingValidationUnified` is true (shadow mode), invokes the validator and logs diffs versus legacy behaviour before enforcing responses.
- Add a shared error-to-HTTP mapper so customer routes can keep 200/400/409 semantics and Ops dashboards receive actionable payloads; retain legacy fallbacks until rollout completes.
- Implement transactional update RPC (`update_booking_with_capacity_check`) mirroring insert logic, exclude the current booking from capacity counts, and ensure we lock relevant rows (`SELECT ... FOR UPDATE`) to stop race conditions.
- Capture overrides centrally: pass override request (reason + capability) through `BookingValidationService`, and on success, attach override metadata to audit logs and observability events (`booking.override.applied`).
- Expose optional preflight endpoint (`POST /api/booking-validation`) to share validation results without committing. Clients (dashboard edit dialog, Ops create modal) can call it to surface consistent disabled states/messages.
- Extend automated coverage: add unit tests for validator (closed day, outside hours, past-time flag toggles, capacity exhaustion, override gating, DST), route tests validating HTTP mapping + telemetry, and E2E smoke to confirm UI parity with `/reserve`.
