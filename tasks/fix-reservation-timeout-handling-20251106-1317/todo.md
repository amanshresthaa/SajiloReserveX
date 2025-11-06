# Implementation Checklist

## Setup

- [x] Document current timeout behavior and failure path.

## Core

- [x] Merge external abort signals with the API client's timeout controller.
- [x] Normalize timeout/cancellation errors into `ApiError` objects with friendly messages.
- [x] Allow per-request timeout override and extend booking submission timeout.
- [x] Ignore cancellation errors in booking mutation + wizard handling.

## Tests

- [x] pnpm lint

## Notes

- Assumptions: Timeout issues originate from client-side abort before server responds.
- Deviations: Deferred reconciliation polling for timed-out submissions.
