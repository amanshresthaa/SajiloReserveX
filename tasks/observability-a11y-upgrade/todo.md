# TODO – Implementation checklist

## Story E1 – Analytics emitter & instrumentation

- [ ] Define strong TypeScript types for analytics event schema (payload, user, context).
- [ ] Implement anon ID + email hash helpers leveraging Supabase session when available.
- [ ] Extend emitter with buffered batching, flush logic (sendBeacon/fetch), and schema injection (user/context metadata, timestamp).
- [ ] Update `/api/events` handler tests/docs if schema changes; ensure dev logging unchanged.
- [ ] Adjust analytics callsites to rely on new emitter signature and cover additional key actions identified during audit.
- [ ] Add Vitest coverage for emitter behaviour (queueing, flush, dev fallback).

## Story E2 – Accessibility audit & fixes

- [ ] Inventory dashboard components/pages and evaluate against checklist.
- [ ] Patch dialogs, buttons, tables, and forms to meet focus, labeling, and interaction requirements.
- [ ] Introduce focus management helper(s) (`components/a11y/FocusGuard.tsx`) if gaps exist.
- [ ] Add automated axe accessibility checks (Playwright integration per requirement).
- [ ] Document findings and verification notes.

## Story F1 – Vitest coverage

- [ ] Expand `/api/bookings?me=1` tests for filters, pagination, and unauthorized cases.
- [ ] Add `useBookings` hook tests for error handling + caching keys.
- [ ] Enhance dialog/component tests for validation, focus, and error messaging.
- [ ] Share common mocks/utilities for fetch/session as needed.

## Story F2 – Playwright flows

- [ ] Ensure Playwright env + seeding hooks ready (reuse current infra; extend if required).
- [ ] Implement dashboard E2E scenarios (login, edit fail -> success, cancel, empty state CTA).
- [ ] Add accessibility axe checks within Playwright runs.
- [ ] Capture verification artifacts/reporting updates.

## Story E3 (optional) – DB/RLS linkage

- [ ] Reuse `customers.auth_user_id` for Supabase linkage; extend schema only if blockers arise.
- [ ] Implement backfill job mapping emails to auth users (best-effort) and update indexes.
- [ ] Add RLS policy aligning bookings access to linked customers.
- [ ] Validate via tests or SQL assertions.

## Cross-cutting validation

- [ ] Run lint/typecheck/test suites as changes progress.
- [ ] Maintain verification log in `tasks/observability-a11y-upgrade/verification.md`.
