# Research: Server Clock Authoritative & Hold Ownership (E5-S1)

## Requirements

- Functional:
  - `createManualHold` and `getManualAssignmentContext` return `serverNow`.
  - UI countdown based on `(expiresAt - serverNow)`.
  - Restrict `extendTableHold` to creator or elevated role; enforce server‑side.
- Non‑functional:
  - Prevent skew from client clocks; consistent UX across reloads.

## Existing Patterns & Reuse

- `createManualHold` returns `{ hold, validation }` but not `serverNow`.
- `getManualAssignmentContext` returns booking, tables, holds, conflicts, window.
- `extendTableHold` accepts `actorId` but no authorization check.
- Membership check patterns exist in manual routes.

## Constraints & Risks

- Server time from `DateTime.now().toUTC()` or DB `now()` must be consistent across pathways.

## Recommended Direction

- Include `serverNow` ISO string in responses for hold creation and context.
- In `extendTableHold`, fetch hold, verify `created_by === actorId` or role is admin/manager for restaurant; otherwise return `AUTH_FORBIDDEN`.
