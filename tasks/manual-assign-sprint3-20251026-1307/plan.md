# Implementation Plan: Manual Assign Sprint 3

## Objective

We will enable ops staff to select, validate, hold, and confirm table assignments directly from the floor plan so that manual workflows deliver conflict-free seating with real-time visibility across devices.

## Success Criteria

- [ ] Manual hold/validate/confirm APIs return structured results (summary + checks) and never accept invalid merges or overlaps.
- [ ] Booking dialog floor plan shows live table states (free/held/blocked) with countdown + owner and reacts to external updates within 5s.
- [ ] Validation badges + side meter reflect current selection (e.g., `2 tables · 8 seats · +1 over`) and surface warnings without blocking confirmations.
- [ ] Legacy RPC fallback removed; all confirm paths route through `assign_tables_atomic_v2` and existing tests updated to reflect new invariants.
- [ ] Alerting + runbooks published covering allocator contention, hold expiry backlog, RPC conflicts, and telemetry ingestion failures.

## Architecture & Components

- **Backend (`server/capacity/tables.ts` & routes)**
  - Extend `computeManualSelection` output with `selection.summary` + `k`, ensure `findHoldConflicts` details include owner + expiry.
  - Introduce `mapManualValidationResponse` helper shared by hold/validate endpoints (status normalization, human-readable message catalogue).
  - `confirmHoldAssignment` to release hold & mirrored allocations on success, wrap RPC errors with actionable codes.
  - Add `listFloorPlanState` service: returns tables + positions, active holds, current assignments for booking’s zone (reusing `loadAssignmentContext`).
- **API Layer**
  - `POST /api/staff/manual/hold`: upsert hold (release existing) and respond with `{hold, validation, summary}`; echoes `tableCount`, `capacity`, `slack`, `overage` string.
  - `POST /api/staff/manual/validate`: returns `{ok, checks[], summary}` without mutating holds.
  - `POST /api/staff/manual/confirm`: calls RPC v2, on success releases hold + returns assignment list; structured errors for conflicts/adjacency breaches.
  - `GET /api/staff/manual/context`: new endpoint delivering floor plan snapshot `{tables[], holds[], assignments[], booking, validation?}` for UI bootstrap.
- **Frontend**
  - `TableFloorPlan.tsx` (new): renders tables via absolute layout using `position` (with safe fallbacks); each table is a focusable toggle button showing state + capacity.
  - Enhance `BookingDetailsDialog.tsx`: integrate floor plan component, selection meter, validation badges, action buttons (Hold, Validate, Assign, Clear), and countdown display.
  - Hooks: `useManualAssignState` (local selection + debounced validation), `useManualAssignRealtime` (Supabase channel `ops-allocations` + `table_holds` w/ fallback polling, sharing logic from `useBookingRealtime`).
  - UI feedback: toast/banner for conflicts, disable assign until validation `ok`, show warnings inline.

## Data Flow & API Contracts

- **Hold/Validate Payload**
  ```json
  {
    "bookingId": "uuid",
    "tableIds": ["uuid", "uuid"],
    "holdTtlSeconds": 180,
    "requireAdjacency": true,
    "excludeHoldId": "uuid"
  }
  ```
  `hold` response: `{ hold: { id, expiresAt, zoneId, tableIds, startAt, endAt }, summary: { tableCount, totalCapacity, slack }, validation: { ok, checks[] } }`.
- **Confirm Payload**
  ```json
  {
    "bookingId": "uuid",
    "holdId": "uuid",
    "idempotencyKey": "string",
    "requireAdjacency": true
  }
  ```
  Response: `{ assignments: [{ tableId, assignmentId, startAt, endAt, mergeGroupId }], bookingId, holdId }`.
- **Context Endpoint**
  - Query: `bookingId`, optional `includeHistory`/`zoneId`.
  - Response: `{ tables: [{ id, tableNumber, capacity, position, status, mobility, zoneId }], holds: [{ id, tableIds, createdBy, createdByName, expiresAt, countdownSeconds }], assignments: [{ bookingId, tableId }], validation: ManualValidationResult | null, booking: { partySize, zoneId, startAt, endAt } }`.
- **Realtime**
  - Subscribe to `allocations`, `table_holds`, `booking_table_assignments` filtered by restaurant/zone.
  - Upon event → refetch context via React Query key `manualAssign.context(bookingId)`; fallback polling every 5s when realtime flag disabled.

## UI/UX States

- **Idle**: No tables selected → instructions + disabled Validate/Assign.
- **Selecting**: Clicking table toggles selection (multi-select). Keyboard arrow navigation & Enter toggle; status badge updates per table state.
- **Validation OK**: Checks show green/neutral badges; meter reads `n tables · m seats · +x over/−y under`.
- **Warnings**: e.g., adjacency warn; badges amber, Assign enabled but warns user.
- **Errors**: e.g., conflict/capacity—Assign disabled, error callout listing blocking checks.
- **Hold Active**: Show banner with countdown + “Held by {name} · Expires in {mm:ss}”; holds from others render as striped tables with tooltip.
- **Blocked**: Tables assigned to other bookings appear with lock icon & tooltip.
- Buttons: Hold (first select auto-holds), Validate (re-run), Assign (confirm), Clear (reset selection), Release (when hold exists but not ours).

## Edge Cases

- Booking without `zoneId` or missing `position`: fallback to list view (existing dropdown) with message; maintain parity for legacy data.
- TTL expiry mid-process triggers forced refresh & disables Assign until new hold created.
- RequireAdjacency false: adjacency check returns `warn`; ensure backend + UI agree so we don’t incorrectly hard-block.
- Concurrency: two staff selecting same tables—ensure hold endpoint returns `HOLD_CONFLICT` with conflicting hold details; UI surfaces and auto-refreshes selection.
- Booking status not assignable (cancelled/no_show) → hold/confirm endpoints return warning/error; UI disables manual assign with explanation.
- Idempotency: confirm endpoint must accept retried payloads without duplicate assignments.

## Testing Strategy

- **Unit (Vitest)**: expand `manualSelection.test.ts` for adjacency warnings, mobility errors, capacity math, `createManualHold` new metadata; add tests for new response mapper.
- **Integration/API**: Route tests covering auth, payload validation, hold conflict scenarios, confirm RPC error propagation.
- **Property**: fast-check harness simulating random booking windows & table selections to ensure `createManualHold` never overlaps existing allocations/holds.
- **Concurrency**: Simulated parallel confirm vs auto-assign to verify only one path succeeds (mock RPC + holds).
- **Playwright**: new `ops/manual-assign.spec.ts` verifying multi-select, adjacency warning toggle, conflict refresh, assign success.
- **Accessibility**: axe on Booking dialog (focus order, ARIA labels for tables), keyboard navigation tests.
- **Telemetry**: unit stub to ensure `emitHoldCreated/Confirmed` invoked with correct payload.

## Rollout

- Stage deploy behind ops feature flag toggle for initial QA; once telemetry baseline captured, enable for all restaurants.
- Document manual verification steps in `verification.md`; include Chrome DevTools MCP runs (mobile/desktop) and Supabase realtime smoke.
- After release, monitor new alerts (lock contention, hold expiry backlog) for 48h; rollback plan: disable manual assign feature flag (UI hides floor plan + reverts to dropdown) and revert to manual hold off.
