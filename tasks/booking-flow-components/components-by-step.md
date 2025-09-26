# Component inventory by step

## ReservationWizard (`reserve/features/reservations/wizard/ui/ReservationWizard.tsx`)

- `Suspense` fallback uses `Icon.Spinner` to show loading state while fetching wizard data.
- `StickyProgress` component provides persistent navigation/actions summary.

## Plan step (`reserve/features/reservations/wizard/ui/steps/PlanStep.tsx`)

- `Card` family (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`) structures the page section.
- `Popover` + `PopoverTrigger` + outline `Button` + `Icon.Calendar` wrap the date picker; `PopoverContent` hosts `Calendar` for selecting a single date.
- `Label` components associate textual labels with date/time/notes controls.
- Party size uses outline `Button` with `size="icon"` for increment/decrement, exposing `aria-label` and `aria-live` for the current value.
- Time selection renders a grid of `Button` entries wrapped in `TooltipTrigger`/`TooltipContent`; each includes a `Badge` showing the slot label and disables unavailable slots.
- Occasion selector leverages `ToggleGroup` + `ToggleGroupItem` to act like segmented radio buttons for booking type.
- `Textarea` captures free-form notes with placeholder example text.
- `TooltipProvider` ensures consistent hover/focus behaviour with delayed hints.

## Details step (`reserve/features/reservations/wizard/ui/steps/DetailsStep.tsx`)

- `Card` layout repeated for consistency.
- `Field` wrapper adds label + helper/error text semantics around `Input` components (`type="text"`, `email`, `tel`).
- `Checkbox` control used for remember/marketing/terms preferences, each nested in a `<label>` for a larger click target.
- Error messaging uses `Icon.AlertCircle` with a styled block to flag missing agreement.

## Review step (`reserve/features/reservations/wizard/ui/steps/ReviewStep.tsx`)

- `Card` container for summary view.
- Optional error banner reuses `Icon.AlertCircle` + border styling.
- Final review content is semantic HTML (`<dl>`, `<dt>`, `<dd>`) paired with utility classes; buttons for confirm/edit are provided through sticky footer metadata.

## Confirmation step (`reserve/features/reservations/wizard/ui/steps/ConfirmationStep.tsx`)

- `Card` again for main layout.
- Status indicator uses `Icon.Info`, `Icon.Clock`, or `Icon.CheckCircle` based on booking status.
- Confirmation summary displayed as `<dl>` list with consistent typography utilities.
- Action handling for calendar/wallet/new booking is surfaced through sticky footer actions (icons defined in `Icon` set).

## Sticky progress (`reserve/features/reservations/wizard/ui/StickyProgress.tsx`)

- Uses `Button` components styled as circular icon buttons for navigation/primary actions.
- Renders `Icon.Spinner` when actions report `loading=true`; other icons resolved from `Icon[...]`.
- Displays step progress bar and summary text with `aria-live` to comply with accessible feedback.
