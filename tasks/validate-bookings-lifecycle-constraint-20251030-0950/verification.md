# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: N/A — backend-only data integrity and RPC updates; manual QA will focus on API responses once deployed to staging.

### Console & Network

- [ ] No Console errors
- [ ] Network requests match contract
- [ ] Performance warnings addressed (notes)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: N/A s
- LCP: N/A s
- CLS: N/A
  Notes: No UI rendered.

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Lifecycle audit query (pre-change) returns `0` inconsistent rows (`SELECT count(*) ...`).
- [ ] Staging execution of remediation + validation succeeds without violations.
- [ ] Staging booking creation rejects outside-hours requests and accepts valid windows.
- [ ] Backfill script completes without orphaned customers; collision report reviewed.
- [ ] Assignment wrappers verified via RPC smoke tests (single and merged tables).

### Evidence

- `SELECT count(*) AS inconsistencies FROM public.bookings WHERE NOT (<constraint predicate>);` → `0` (pre-change audit).
- `ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_lifecycle_timestamp_consistency;` → Pending prod execution (will capture output post-run).
- `SELECT conname, convalidated FROM pg_constraint WHERE conname = 'bookings_lifecycle_timestamp_consistency';` → `t` (post-validation check already observed; re-run after deployment to confirm).

## Known Issues

- [ ] (owner, priority)

## Sign-off

- [ ] Engineering
- [ ] Design/PM
