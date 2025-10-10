# Implementation Checklist

## Setup

- [x] Confirm ops team navigation entry + route structure
- [x] Decide on details metadata shape for “Created by System”

## Wizard Enhancements

- [x] Add `mode` support to booking wizard + DI plumbing
- [x] Create ops details schema (optional email/phone) and integrate with form controller
- [x] Allow draft transformer to emit nullable contact fields
- [x] Add ops-specific mutation hook targeting new API

## Ops API

- [x] Implement `POST /api/ops/bookings` with membership enforcement
- [x] Tag bookings as system-created (source + details)
- [x] Trigger side effects + conditional email send
- [x] Add route tests (success, missing membership, validation cases)

## Ops UI Integration

- [x] Build `/ops/bookings/new` page embedding wizard
- [x] Provide restaurant selector + propagate selection to wizard
- [x] Ensure post-confirm navigation back to dashboard or staying in flow
- [x] Surface “Created by System” label in dashboard list + detail dialog

## QA & Docs

- [x] Update/extend relevant unit tests (wizard schemas, draft builder)
- [ ] Manual QA: create walk-in booking without email, verify dashboard + emails
- [ ] Update task verification report
