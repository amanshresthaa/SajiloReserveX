# Implementation Plan: Disable Inngest Build Blocker

## Objective

We will remove the unused Inngest webhook and queue wiring so that builds no longer depend on `INNGEST_SIGNING_KEY` and side-effects run synchronously.

## Success Criteria

- [ ] `pnpm run build` succeeds without setting `INNGEST_SIGNING_KEY`.
- [ ] Booking side-effects work synchronously with no Inngest dependency.

## Architecture & Components

- Delete `src/app/api/inngest/route.ts` and `server/queue/inngest.ts`.
- Simplify `server/jobs/booking-side-effects.ts` so `enqueue*` helpers call the processors inline.

## Data Flow & API Contracts

Endpoint: `GET/POST /api/inngest`
Response: should short-circuit with 503 or informative message when Inngest disabled.
Errors: consistent with existing error handling.

## UI/UX States

- N/A (API route only).

## Edge Cases

- Key absent in non-production env vs production.
- Route should not expose sensitive info.

## Testing Strategy

- Unit/integration: update booking side-effect tests to cover synchronous path.
- Manual: run `pnpm run build`.

## Rollout

- Not behind flag; document that asynchronous queue is no longer available and tests rely on inline execution.
