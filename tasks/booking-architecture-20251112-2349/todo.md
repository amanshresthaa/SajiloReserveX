---
task: booking-architecture
timestamp_utc: 2025-11-12T23:49:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: [feat.booking_pipeline.v1]
related_tickets: []
---

# Implementation Checklist

## Setup

- [ ] Confirm event bus + Redis infra baselines with SRE (doc outcomes in research.md addendum).
- [ ] Extend `config/booking-state-machine.ts` and shared types with new lifecycle statuses.
- [ ] Scaffold worker package (AssignmentCoordinator + SmartAssignmentEngine) with feature flag plumbing.

## Core

- [ ] Implement BookingStateMachine service (optimistic writes + history logging + events).
- [ ] Build DistributedLockManager with metrics + Lua scripts + tests.
- [ ] Implement SmartAssignmentEngine strategy registry, scoring, and TableAvailabilityTracker integration.
- [ ] Wire AssignmentCoordinator orchestration, retries, manual review fallback, and notification publishing.
- [ ] Expose REST/RPC endpoints for manual review + attempt history.

## UI/UX

- [ ] Update Ops booking list + heatmap filters for expanded statuses (`src/hooks/ops/*`).
- [ ] Add manual review queue view with accessible status badges + keyboard flows.
- [ ] Ensure notifications/localized strings cover new states (manual review + confirmed after retry).

## Tests

- [ ] Unit tests (state machine, lock manager, strategy scoring, availability snapshot, retry scheduler).
- [ ] Integration tests (event-driven coordinator path, hold confirmation, manual review fallback).
- [ ] Stress/perf tests for 500 concurrent bookings; record metrics.
- [ ] Axe + keyboard-only audit for updated Ops UI screens.

## Notes

- Assumptions: Redis cluster + event bus already provisioned; Supabase remains source of truth for bookings; manual review UI work will happen in the same sprint.
- Deviations: None yet — record here if we diverge from plan.

## Batched Questions

- Pending responses on event bus choice, SLA for retries, telemetry destination (see research open questions).
