# Implementation Checklist

## Setup

- [x] Ensure env vars point to the correct backend (staging vs prod).
- [x] Start `pnpm dev` and confirm it compiles.

## Core

- [x] Log in with the provided credentials.
- [x] Navigate each primary route listed in the inventory; note auth state requirements.

## UI/UX

- [x] Capture whether each page renders without errors.
- [x] Document redirects or missing data for dynamic routes.

## Tests

- Not applicable (manual review only).

## Notes

- Assumptions: Routes without real data can be marked as “requires data” instead of forcing deletion.
- Deviations: Ops rejections route returns a 404 despite code existing; likely stale or removed in routing config.
