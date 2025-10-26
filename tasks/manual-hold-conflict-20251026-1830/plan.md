# Implementation Plan: Manual Hold Multi-Seat Selection

## Objective

We will enable staff to combine multiple seatings for a booking so that manual hold supports parties larger than a single table's capacity.

## Success Criteria

- [ ] Manual hold allows selecting multiple seatings when total seats meet or exceed party size.
- [ ] Conflicts raised only when selected seatings truly overlap or are unavailable.

## Architecture & Components

- API: `src/app/api/staff/manual/hold/route.ts` will continue delegating to `createManualHold`, but the 409 branch will inject a `details` payload (mirroring `validation.summary`) to keep downstream consumers in sync.
- Client: `src/components/features/dashboard/BookingDetailsDialog.tsx` holds the `holdMutation`; update its `onError` handler to intercept structured validation errors and treat them as non-blocking, while leaving true conflicts untouched.
- Shared HTTP utilities stay untouched except for reading the new `details` shape via the existing `HttpError`.

## Data Flow & API Contracts

Endpoint: `POST /api/staff/manual/hold`
Request: `{ bookingId: string; tableIds: string[]; holdTtlSeconds?: number; requireAdjacency?: boolean; excludeHoldId?: string }`
Response (success): `{ hold: ManualHoldSummary; validation: ManualValidationResult; summary: ManualSelectionSummary }`
Response (validation failure – new shape): status **409**, `code: "VALIDATION_FAILED"`, body keeps `validation` & `summary` plus `details: { validation, summary }` for error consumers.
Errors: Other conflicts continue to return their specific codes (e.g. `HOLD_CONFLICT`), which should still surface as destructive toasts.

## UI/UX States

- Loading: floor plan buttons disabled while the hold mutation is pending (existing behaviour).
- Partial selection / capacity shortfall: surface the validation card with capacity error, no toast; selection remains so the user can add more tables.
- Conflict (e.g. overlap with another hold): continue to show destructive toast and highlight validation card details once available.
- Success: hold created, validation checks show success/warnings, confirmation button enabled.

## Edge Cases

- Selecting tables spanning different zones still returns validation errors; ensure those are shown inline.
- Genuine conflicts (another booking holding the same table) must still trigger a blocking error + toast.
- Offline/network failures should keep existing error handling.
- Ensure default selection restored from `manualContext.activeHold` still works because we only skip `setUserModifiedSelection(false)` when no hold is returned.

## Testing Strategy

- Unit: Add a focused test around the new helper that interprets `HttpError` (extract method) so we can exercise validation/no-toast vs real error branching.
- Integration: Validate manually via booking dialog in dev — select insufficient capacity (expect inline validation, no toast), then add extra table (hold created, manual context refreshes).
- E2E: Not in scope now; note gap.
- Accessibility: Verify manual QA to ensure focus/keyboard interactions unchanged during multi-table selection.

## Rollout

- Feature flag: N/A (behavioural refinement).
- Exposure: Immediate after deploy.
- Monitoring: Watch Next.js logs for reduced `/api/staff/manual/hold 409` spam; monitor ops feedback for manual assignment UX.
