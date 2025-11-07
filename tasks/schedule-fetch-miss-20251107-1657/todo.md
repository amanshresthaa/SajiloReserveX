# Implementation Checklist

## Setup

- [x] Confirm current behavior: load wizard with legacy draft forcing `demo-restaurant` slug and observe schedule 404s.
- [x] Capture Supabase CLI evidence (done in research).

## Core Changes

- [x] Refactor `useWizardDraftStorage` to support slug-scoped keys plus legacy fallback/migration.
- [x] Update `useReservationWizard` to pass the active slug into load/save/clear helpers and emit/reset when slugs mismatch.
- [x] Add analytics `wizard.reset.triggered` payload for slug mismatch; reuse existing alert copy.

## Verification

- [x] `pnpm exec eslint reserve/features/reservations/wizard/hooks/useReservationWizard.ts reserve/features/reservations/wizard/hooks/useWizardDraftStorage.ts --max-warnings=0`
- [x] Manual UI smoke: ensure `schedule.fetch.miss` emits current slug after clearing cached data (documented in verification.md).
