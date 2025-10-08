# TODO — US-005/006/007 Delivery

## US-005 — Profile Management

- [x] Add Supabase migration + types for `profile_update_requests`.
- [x] Extend `/api/profile` PUT for idempotency + analytics.
- [x] Update `useUpdateProfile` to send idempotency header & handle duplicates.
- [ ] Enhance `ProfileManageForm` UX (duplicate messaging, aria-live tweaks).
- [x] Write Vitest coverage (hook + form duplicate + avatar error path).
- [ ] Expand Playwright coverage (avatar failure, keyboard flow).

## US-006 — Wizard QA & Offline

- [x] Introduce offline banner component + integrate into wizard layout.
- [x] Instrument offline analytics + disable confirm actions when offline.
- [ ] Add skeleton parity + optimistic error handling improvements.
- [ ] Extend `useCreateReservation` analytics/idempotency reset.
- [x] Add Vitest coverage for offline analytics & disabled actions.
- [ ] Add Vitest coverage for mutation error handling.
- [ ] Update Playwright offline + failure scenarios.

## US-007 — Auth Flow & Guards

- [ ] Audit/extend middleware coverage for wizard thank-you routes.
- [ ] Rebuild `/signin` UI with RHF + shadcn + analytics.
- [ ] Implement Supabase password + magic link flows w/ focus management.
- [ ] Add Vitest coverage for sign-in form logic.
- [ ] Refresh Playwright auth specs for new UI.
- [ ] Document env/test instructions & analytics events.
