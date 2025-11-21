---
task: lint-email-worker-any
timestamp_utc: 2025-11-21T20:11:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Resolve email worker lint warnings

## Requirements

- Functional: address `@typescript-eslint/no-explicit-any` warnings in `scripts/queues/email-worker.ts` so pre-commit lint passes.
- Non-functional: preserve existing email worker behavior and queue processing semantics while improving type safety.

## Existing Patterns & Reuse

- Email jobs already typed via `Job<EmailJobPayload>` from `@/server/queue/email`.
- Booking data uses `BookingRecord` from `@/server/bookings` but is currently narrowed with `any` to access suppression info and default case logging.
- Worker logs and observability events already structured; changes should reuse current logging contexts.

## External Resources

- None needed; rely on existing types in the codebase.

## Constraints & Risks

- Must keep runtime behavior unchanged, especially suppression checks and DLQ routing.
- Any new types should handle nullable relational data gracefully to avoid runtime throws.

## Open Questions (owner, due)

- None at this time.

## Recommended Direction (with rationale)

- Replace `any` casts with narrow helper types/interfaces describing the specific fields accessed (suppression flag and job type) to satisfy lint without widening scope.
- Keep defensive nullish checks to avoid unexpected runtime errors while maintaining the current control flow.
