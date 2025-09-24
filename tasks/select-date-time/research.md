# Research: Select Date & Time

## What already exists
- `components/reserve/steps/PlanStep.tsx` implements date, time, party-size, booking-type, seating, and notes capture inside a shadcn `Card`. It wires into the shared reducer via `dispatch({ type: "SET_FIELD", ... })` and progresses to step 2 with `dispatch({ type: "SET_STEP", step: 2 })`. Slots are rendered as horizontal button rails with scroll affordances and explicit aria-disabled handling for past times.
- `components/reserve/booking-flow/index.tsx` instantiates the reducer (`state.ts`) and passes `onActionsChange` to each step so the sticky footer mirrors available actions. Confirmation submission occurs later (`handleConfirm`), so PlanStep is purely for state prep.
- `components/reserve/booking-flow/state.ts` defines `BookingDetails` with `date`, `time`, `party`, `bookingType`, `seating`, `notes`, `restaurantId` (defaulting to `DEFAULT_RESTAURANT_ID`), giving us the canonical state contract.
- `components/reserve/helpers.ts` provides the slot generation (`slotsByService`), formatting utilities, validation helpers (`isEmail`, `isUKPhone`), and `bookingTypeFromTime` inference we can reuse instead of re-implementing business logic.
- `components/reserve/booking-flow/sticky-progress.tsx` + `use-sticky-progress.ts` handle the animated, accessible sticky footer actions that accompany each step. PlanStep currently exposes a single "Continue" action to this bar; we can expand the action set if we e.g. add “Check availability” or venue switching triggers.

## Server + data model alignment
- `/app/api/bookings/route.ts` expects `{ date: YYYY-MM-DD, time: HH:MM, party, bookingType, seating, ... }` and derives the end time + meal type before allocating a table. Our step must guarantee these fields are defined when the user exits the step.
- `server/bookings.ts` functions (`deriveEndTime`, `inferMealTypeFromTime`, `findAvailableTable`) rely on normalized `time` values (`HH:MM`). PlanStep already normalizes input via `bookingHelpers.normalizeTime` before dispatching state, so reusing this helper avoids drift.
- Schema in `current.sql` shows `bookings.booking_date` (DATE) and `bookings.start_time` (TIME WITHOUT TZ) as required columns; there’s a `CHECK (party_size > 0)` constraint. Verifying against `types/supabase.ts` confirms the generated types align with these fields.

## Accessibility & interaction patterns to reuse
- PlanStep uses shadcn `Button`, `Input`, `Popover`, `Calendar`, `Label`, and wraps form controls with a reusable `Field` component that surfaces inline errors and attaches accessible labels via `htmlFor`. Keep this structure to satisfy the `agents.md` MUSTs (inline errors, keyboard focus, large targets).
- Time and party controls expose scrollable rails with `snap-x` classes, and PlanStep guards against past-time selection via `isPastSlot`. We should preserve or extend these behaviours so low-power/mobile performance constraints remain satisfied.
- Sticky actions and the overall container add extra bottom padding when the sticky bar is visible (`paddingBottom` manipulation in `index.tsx`). Any new interactions must respect this to avoid content being obscured.

## Verification steps already performed
1. Located PlanStep with `rg "PlanStep"` and inspected behaviour using `sed`; cross-checked with reducer definitions to ensure state keys match.
2. Cross-referenced API contract in `/app/api/bookings/route.ts` and the Supabase schema (`current.sql`, `types/supabase.ts`) to confirm field names and types line up with front-end state.
3. Verified sticky-action plumbing via `components/reserve/booking-flow/sticky-progress.tsx` to ensure PlanStep’s `onActionsChange` output is reflected consistently.

## Gaps, risks, open questions
- No explicit venue selector exists; PlanStep assumes a single `DEFAULT_RESTAURANT_ID`. Multi-venue support would require fetching available venues and updating this step’s state contract plus API payload.
- Availability is inferred locally from static service windows; there’s no real-time check against Supabase availability rules. If the MCP integration needs live availability, we’ll need to add a fetch step (e.g., hitting `/app/api/bookings` or a new availability endpoint) and reconcile UI latency.
- “Choose table” is not represented here—allocation occurs server-side. Introducing table previews may change this step’s surface.

## Outstanding uncertainties
- Are service windows still accurate for all venues once multi-venue support lands? We may need per-venue slot configuration instead of helpers-based inference.
- We have no instrumentation tests covering PlanStep interactions. Any refactor should add at least unit tests around helper logic or integration tests once a testing harness exists.
