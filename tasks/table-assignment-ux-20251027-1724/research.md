# Research: Table Assignment UX

## Existing Patterns & Reuse

- `BookingDetailsDialog` (src/components/features/dashboard/BookingDetailsDialog.tsx) already wires the manual assignment flow end-to-end: selection state, validation, hold creation, and confirmation live there today.
- `TableFloorPlan` (src/components/features/dashboard/TableFloorPlan.tsx) normalises manual assignment context data to render an interactive floor grid and tag tables that are held, conflicted, inactive, or already allocated.
- `useManualAssignmentContext` (src/hooks/ops/useManualAssignmentContext.ts) provides real-time refresh via Supabase channels when holds/allocations shift, so the UI can trust the shared query key instead of bespoke polling.
- Ops table assignment mutations (`useOpsTableAssignmentActions`) encapsulate optimistic cache invalidation for assign/unassign actions and toasts; new UI should invoke these helpers rather than calling services directly.
- Prior task research (`tasks/booking-table-release-bug-20251027-1442/research.md`) highlighted that UI interactivity should be driven by conflict/hold data instead of raw table status, which is already reflected in `TableFloorPlan` logic.

## External Resources

- `getManualAssignmentContext` (server/capacity/tables.ts:1043) assembles booking metadata, current assignments, conflicting windows, and active/other holds. Response shape mirrors `ManualAssignmentContext` in `src/services/ops/bookings.ts`.
- Manual hold API (`src/app/api/staff/manual/hold/route.ts`) enforces auth, validates payloads, and returns `{ hold, validation, summary }` or `409` errors with `validation` payloads that front-end should surface.
- Manual validation API (`src/app/api/staff/manual/validate/route.ts`) performs the same checks without creating a hold—useful for explicit refresh.
- Manual confirm API (`src/app/api/staff/manual/confirm/route.ts`) wraps `confirmHoldAssignment`, returning final assignments array. Front-end must send the hold idempotency key generated in BookingDetailsDialog.
- `ManualAssignmentContextHold` includes creator name/email (hydrated in server/capacity/tables.ts) and `countdownSeconds` that can power richer timers/tooltips.
- Policies in server/capacity/policy.ts (buffer bands, adjacency requirements) determine the booking window and should be reflected in user messaging (e.g., why adjacency toggle may be required).

## Constraints & Risks

- Holds expire quickly (`MANUAL_HOLD_TTL_SECONDS = 180`); UI needs to make the countdown obvious and gracefully recover when hold lapses.
- Validation errors returned from hold creation include structured `checks` (status `ok|warn|error`); blocking errors must prevent confirmation, but warnings should remain non-blocking with guidance.
- The selection summary depends on `manualContext.tables`. When no position data exists, the UI falls back to a list of chips—new design must handle that empty/fallback state responsively.
- Adjacency requirement toggle is persisted only in client state; backend defaults may still demand adjacency depending on venue policy, so messaging must clarify when “Adjacency off” will still be rejected.
- Manual release (`manualReleaseHold`) requires booking id + hold id; UI must avoid leaving orphaned holds when user clears selection or closes dialog mid-flow.
- Accessibility: current floor plan uses buttons with focus rings; any redesign must retain keyboard toggling and accessible summaries (e.g., selected tables list) to satisfy WCAG expectations from AGENTS.md.

## Open Questions (and answers if resolved)

- Q: Can we surface auto-suggested table bundles from the backend to reduce manual hunting?
  A: The manual context response does not include ranked suggestions; only the auto-assignment RPC (`autoQuoteTables`) returns candidates. We would need an additional call or reuse of that endpoint if we want “suggested tables” in the manual UI.
- Q: Should hold countdown updates rely on polling or realtime?
  A: `useManualAssignmentContext` already refreshes every 10s (or realtime if env flag set). We can add a local timer (like the existing `currentTimestamp` state) for smooth countdown without extra network.
- Q: Is it safe to rely solely on conflict data instead of table status when disabling selection?
  A: `TableFloorPlan` already treats non-`available` status as inactive, but prior research showed stale statuses; we should continue to respect the helper which already prioritises conflicts and holds, avoiding duplicate logic in the new UI wrapper.

## Recommended Direction (with rationale)

- Restructure manual assignment into a guided flow: (1) Inspect availability/floor plan, (2) Review validation checks with inline guidance, (3) Confirm assignment. This aligns with backend lifecycle (context → hold/validation → confirm) and clarifies next steps.
- Introduce a right-hand “Selection Summary” card that always shows party size, capacity slack, zone, and hold status with a prominent countdown, leveraging `ManualAssignmentContext` metadata so staff can decide quickly.
- Replace the flat validation list with status-badged accordions or step indicators so blocking issues stand out, reusing `Check`, `AlertTriangle`, and `XCircle` icons but adding actionable copy (“requires adjacency — turn it back on”).
- Provide explicit CTAs for “Save hold” vs “Confirm assignment” with disabled states tied to backend readiness, and surface last validation timestamp so rapid revalidations feel responsive without waiting for debounce.
- For unpositioned tables, turn the chip list into a compact table grouping by zone/section to reduce hunting when the floor plan is missing, reusing existing `Table` component styles for consistency.
