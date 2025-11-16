---
task: resend-quota-guard
timestamp_utc: 2025-11-15T15:23:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Resend quota guard

## Objective

Ensure local/dev bookings no longer blow up when Resend daily quota is reached by introducing a safe mock transport that is default-on outside production environments.

## Success Criteria

- [ ] Bookings complete without throwing when Resend quota is exceeded during dev/test runs.
- [ ] Production still attempts to deliver via Resend (no regression to live traffic).
- [ ] Developers can force the mock on/off with a documented env var.

## Architecture & Components

- `libs/resend.ts`: extend config parsing to detect `RESEND_USE_MOCK` (default true unless `NODE_ENV === 'production'` or explicit false). Provide mock response path instead of hitting Resend SDK. Log structured message for observability.
- `server/emails/bookings.ts` + other consumers automatically reuse `sendEmail`, so no extra work.

## Data Flow & API Contracts

- No API schema changes. `sendEmail` still resolves to object with `emailId`. When mock is active, return deterministic fake ID (`mock-email-<timestamp>`). When disabled, use actual Resend response.
- Error path: If Resend SDK rejects for quota while mock disabled (production), existing error propagation remains.

## UI/UX States

- N/A (backend behavior only). Surface logging so CLI shows `[resend] Mock send` entries for developer clarity.

## Edge Cases

- `RESEND_USE_MOCK=false` but quota hit => ensure existing error persists.
- Tests rely on string matching for logs? guard by gating message text.
- When mock is active, ensure attachments or templates still validated? optionally skip heavy validations but at least ensure payload shape logged.

## Testing Strategy

- Unit-ish: add/adjust tests? (if coverage exists). At minimum run targeted script or `pnpm test resend`? If not feasible, add integration note.
- Manual: run booking flow locally verifying logs show mock send and API still returns 201.

## Rollout

- Feature flag: `RESEND_USE_MOCK` env var; default `true` for dev/test, `false` for production (document in `.env.example`).
- No monitoring changes. QA just watches console during dev.

## DB Change Plan (if applicable)

- N/A.
