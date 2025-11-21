---
task: lint-email-worker-any
timestamp_utc: 2025-11-21T20:11:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Resolve email worker lint warnings

## Objective

Improve typing in `scripts/queues/email-worker.ts` by removing `any` usage so lint/pre-commit passes without altering runtime behavior.

## Success Criteria

- [ ] ESLint completes with zero warnings or errors for `scripts/queues/email-worker.ts`.
- [ ] Email worker logic remains functionally equivalent (suppression, DLQ handling, and event logging unchanged).

## Architecture & Components

- File: `scripts/queues/email-worker.ts`
- Add narrow helper types/interfaces to describe the fields used from the Supabase booking query (suppression flag) and job payload type narrowing for the default guard.
- Keep existing BullMQ `Job<EmailJobPayload>` typing and logging helpers intact.

## Data Flow & API Contracts

- Booking fetch already uses Supabase; we only type the shape needed for suppression checks.
- No API contract changes; logging and DLQ payloads remain the same.

## UI/UX States

- Not applicable (worker-only change).

## Edge Cases

- Booking record missing suppression info -> default to false, preserving current behavior.
- Unknown job types should still surface clear errors without `any`.

## Testing Strategy

- Run targeted ESLint: `pnpm exec eslint scripts/queues/email-worker.ts --max-warnings=0`.
- If available, run broader lint suite if quick (`pnpm lint`), time permitting.

## Rollout

- No feature flag or rollout needed; worker change is safe to deploy with lint compliance.

## DB Change Plan

- Not applicable.
