# Implementation Checklist

## Setup

- [x] Confirm approved queue backend (Redis/BullMQ vs SQS) and required env variables/credentials.
- [x] Scaffold queue directory structure + worker entry script; add BullMQ dependency if approved.
- [x] Draft Supabase migration for hold metadata backfill + schema validation aids.

## Core

- [x] Refactor booking side-effects to enqueue durable email jobs; handle idempotency + DLQ routing.
- [x] Implement queue worker with retry/backoff policy and monitoring hooks.
- [x] Build policy retry helper wrapping confirm/quote; log drift metrics and trigger admin notifications.
- [x] Enforce hold metadata validator in confirmation path; integrate with new retry flow.
- [x] Implement admin notification + metrics for policy drift recoveries/failures.
- [x] Execute migration/backfill for existing holds and ensure creation paths populate required metadata.
- [x] Update feature-flag configuration + documentation for new toggles.
- [x] Migrate existing `setTimeout` usage & other email send call sites to new queue helper.

## UI/UX

- [ ] N/A

## Tests

- [x] Unit
- [ ] Integration
- [ ] E2E (critical flows)
- [ ] Axe/Accessibility checks

## Notes

- Assumptions:
- Deviations:

## Batched Questions (if any)

-
