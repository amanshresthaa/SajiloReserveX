---
task: resend-quota-guard
timestamp_utc: 2025-11-15T15:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Inspect `libs/resend.ts` for existing mock toggles or config.
- [x] Introduce `RESEND_USE_MOCK` env parsing + defaults.

## Core

- [x] Update `sendEmail` to branch to mock implementation when enabled.
- [x] Ensure mock path logs and returns fake `emailId` without throwing.
- [x] Document env var in `.env.example` (and optionally README snippet).

## UI/UX

- [ ] N/A

## Tests

- [ ] Add/adjust unit coverage if harness exists; otherwise capture manual validation notes.

## Notes

- Assumptions: Developers want mock by default in dev/test; production can override via env.
- Deviations: No dedicated unit test coverage added (existing suite lacks resend harness); tracked via verification. Default mock behavior now auto-disables when real credentials are provided.

## Batched Questions

- None.
