---
task: email-delivery-fix
timestamp_utc: 2025-11-15T13:53:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Capture current logs/behavior for context (resend successes without IDs).
- [ ] Confirm `.env.local` does not set `SUPPRESS_EMAILS` (not performed; fix does not rely on that value).

## Core

- [x] Update `libs/resend.ts` to inspect `result.error` and missing IDs, throwing descriptive errors.
- [x] Improve logging to include error metadata while keeping existing structured context.

## Tests

- [x] Add a Vitest covering the failure case by mocking the Resend client, ensuring `sendEmail` rejects when API responds with `{ error }`.
- [x] Run the targeted test suite (and at least `pnpm test:ops` if impacted) to verify no regressions.

## Notes

- Assumptions: Resend SDK response shape matches v6.1.0 docs; no need for new feature flag.
- Deviations: No UI work, so manual Chrome QA not required.

## Batched Questions

- None.
