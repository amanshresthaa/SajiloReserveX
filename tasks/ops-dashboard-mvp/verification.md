# Verification Report: Ops Dashboard MVP

## Test Scenarios

- [ ] Authenticated restaurant member sees today's bookings summary _(pending manual QA; requires seeded login flow)_
- [ ] No memberships triggers invite-needed state _(pending manual QA)_
- [ ] No bookings today shows empty state with helpful guidance _(pending manual QA)_
- [x] Supabase error surfaces developer-visible logs without crashing UI _(verified via code inspection + new error-handling path in `app/(ops)/ops/page.tsx`)_
- [ ] Past-start bookings surface attention badge prompting follow-up _(pending manual QA)_
- [ ] Completed / cancelled bookings appear visually de-emphasised on schedule _(pending manual QA)_
- [ ] Show/No-show toggle updates Supabase status after confirmation _(pending manual QA)_
- [ ] Selecting a different date via calendar updates bookings and metrics _(pending manual QA)_
- [ ] Calendar heatmap reflects guest volume intensity (60 covers baseline) _(pending manual QA)_

## Accessibility Checklist

- [ ] Keyboard navigation covers all interactive elements _(pending manual QA)_
- [ ] Focus indicators visible on all controls _(pending manual QA)_
- [ ] Screen reader announces key stats and statuses meaningfully _(pending manual QA)_
- [ ] Live regions or status updates are polite and informative _(pending manual QA)_

## Performance Metrics

- [ ] Dashboard loads within acceptable latency on seeded data _(pending manual measurement)_
- [x] Booking summary handler avoids redundant queries _(unit test confirms single query path and timezone scoping)_

## Commands Executed

- `pnpm lint` ✅
- `pnpm test --filter getTodayBookingsSummary` ⛔️ (Vitest 3.2 CLI does not support `--filter`; see follow-up)
- `pnpm test` ⛔️ (`reserve/tests/unit/CustomerNavbar.test.tsx` fails — pre-existing)
- `npx --yes tsx --test tests/server/ops/getTodayBookingsSummary.test.ts` ✅ (aggregation + new totals fields verified)

## Known Issues

- `pnpm test` currently fails due to existing expectation in `reserve/tests/unit/CustomerNavbar.test.tsx:62`; unrelated to ops dashboard changes.
- Vitest CLI bundled in repo rejects `--filter`; use `npx --yes tsx --test …` for Node-based ops summary tests until scripts are updated.
- Manual QA (auth flow, empty states, accessibility review) still outstanding.

## Summary

Automation confirms the enriched booking summary (contact/reference/detail fields plus upcoming/completed/no-show totals) still aggregates correctly, and linting passes after the dashboard gained calendar-based date selection, responsive metrics, detail dialogs, and past-start attention states. The schedule now relies on the calendar (upcoming filter removed) and uses muted styling for completed/cancelled/no-show bookings, with details panels surfacing raw metadata. Remaining work: execute manual QA against seeded data (calendar navigation, keyboard travel, responsive table/cards, attention badges, greyed-out styling), resolve the upstream `CustomerNavbar` unit test failure (outside this effort), and consider improving the Vitest command ergonomics for targeted runs.

## Sign-off

- [ ] Engineering approved
- [ ] Design approved
- [ ] Product approved
