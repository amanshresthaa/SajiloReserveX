# Implementation Checklist

## Sprint 1 — Immediate Containment

- [x] Implement `requireSession` and `requireRestaurantMember` guard utilities (server/auth/guards.ts).
- [x] Refactor `/api/bookings/[id]` PUT (dashboard path) to require guards before service-role access.
- [x] Enhance audit logging metadata for booking updates.
- [x] Add unit tests covering 401/403 and authorized paths for dashboard updates.
- [x] Verify FE error handling still surfaces new codes/messages.
- [x] Document instrumentation approach for monitoring (may stub if pending infra).

## Sprint 1 — Guest Lookup Spike

- [x] Inspect schema for guest lookup needs (customers/contact hashing feasibility).
- [x] Draft ADR comparing RLS hash vs service-role approach.
- [x] Build PoC (flagged) for chosen option (pending decision).

## Sprint 1 — Monitoring & Protection

- [x] Inventory/implement rate limiting utility and integrate with booking/ops routes.
- [x] Emit observability events + draft alert thresholds.

## Sprint 2 Preparation

- [x] Design guest lookup rollout implementation plan (post-ADR).
- [x] Fix invitation acceptance pagination/idempotency.
- [x] Refactor ops booking status guard + tests.

## Testing & Verification

- [x] Run relevant unit/integration tests.
- [ ] Perform Chrome DevTools QA once UI changes (if any) land.
- [x] Update verification.md with scenarios & results.

## Questions / Blockers

- Are Redis/Upstash resources available for rate limiting, or do we need to implement alternative storage?
- Is there an existing feature flag registry file to register `FEATURE_GUEST_LOOKUP_POLICY` and `FEATURE_OPS_GUARD_V2`?
