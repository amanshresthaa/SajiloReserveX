# Booking flow component research

## Code structure

- Booking flow implemented as a four-step wizard in `reserve/features/reservations/wizard/ui`.
- `ReservationWizard.tsx` orchestrates steps (`PlanStep`, `DetailsStep`, `ReviewStep`, `ConfirmationStep`) and the sticky footer (`StickyProgress`).
- Shared state handled by `useReservationWizard` hook (manages reducer state, sticky progress actions, analytics, etc.).

## Step-specific component usage

### Plan step (`ui/steps/PlanStep.tsx`)

- Layout wrapper via `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`.
- Date picker uses `Popover` (`PopoverTrigger`, `PopoverContent`) + outline `Button` and inline `Icon.Calendar`; calendar rendered with `Calendar`.
- Party size control uses outline `Button` variants with `size="icon"` for decrement/increment and a live region div for the current count.
- Time selection grid renders `Button` components inside a `TooltipProvider`; each slot shows `Badge` labels and uses `TooltipTrigger`/`TooltipContent` to flag disabled slots.
- Occasion selector uses `ToggleGroup` + `ToggleGroupItem` to represent booking types (`lunch`, `dinner`, `drinks`).
- Notes capture via `Textarea`.
- Accessibility helpers: `Label` components; tooltips delay logic w/ `hoveredSlot` state; disabled state derived from service availability helpers.

### Details step (`ui/steps/DetailsStep.tsx`)

- Same `Card` structure for layout.
- Form rows built with shared `Field` component (from `@reserve/shared/ui/Field`) wrapping `Input` controls (`type="text"`, `email`, `tel`), delivering labels, required markers, inline errors.
- Consent options implemented with `Checkbox` components inside `<label>` wrappers for generous hit targets; highlight block for terms uses custom border/background classes.
- Error feedback for missing agreement uses `Icon.AlertCircle` plus styled message banner.

### Review step (`ui/steps/ReviewStep.tsx`)

- `Card` layout again with header/description.
- Error message banner reuses `Icon.AlertCircle` with border/shadow styling.
- Summary details rendered as semantic `<dl>` grid (no additional custom components beyond typography classes).
- Actions for sticky footer configured via `StepAction` definitions (Confirm button shows spinner via `loading` flag, see `StickyProgress`).

### Confirmation step (`ui/steps/ConfirmationStep.tsx`)

- `Card` layout for confirmation summary.
- Status icon uses `Icon.Info`, `Icon.Clock`, or `Icon.CheckCircle` depending on booking status.
- CTA buttons (calendar, wallet, new booking) surfaced via actions metadata consumed by sticky progress, plus inline event handlers for share/add-to-calendar flows.
- Reservation metadata presented as `<dl>` grid with typography utilities.

### Sticky progress (`ui/StickyProgress.tsx`)

- Persistent footer uses `Button` components with circular styling for navigation/actions, optionally showing `Icon.Spinner` when `loading` true.
- Displays step indicators (custom `<span>` bars) and summary text; uses `aria-live` for accessibility.

## Shared utilities involved

- Icons supplied by `@reserve/shared/ui/icons` (various glyphs incl. `Calendar`, `Spinner`, `AlertCircle`, etc.).
- Analytics tracking via `@/lib/analytics` (`track` calls on interactions).
- Booking calculations rely on `bookingHelpers` from `@reserve/shared/utils/booking` (formatting dates, times, service windows, validation).

## Existing interaction/accessibility patterns

- Buttons use accessible labels and `aria-label`s for icon-only variants (e.g., time selector, sticky progress controls).
- Tooltip usage aligns with APG guidance (trigger as child, `delayDuration` adjustments for repeated hover).
- Form fields rely on `Field` wrapper to manage labels, `required`, and error text for compliance with accessibility rules.
- Live regions (`aria-live="polite"`) announce dynamic values like party size in Plan step.
