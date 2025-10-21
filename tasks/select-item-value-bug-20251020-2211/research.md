# Research: Select Item Missing Value

## Existing Patterns & Reuse

- `components/ui/select.tsx` wraps Radix `SelectPrimitive`; its type guard enforces non-empty `value` props for `SelectItem`, so other selects always pass meaningful identifiers.
- Many feature forms (e.g., `components/features/restaurant-settings/ServicePeriodsSection.tsx`) show empty states inside the dropdown using `<div>` placeholders plus disabling the control instead of rendering an empty `SelectItem`.

## External Resources

- Radix UI Select docs – `Item` values must be non-empty strings to avoid conflicts with the cleared state.
- Internal pattern found in `reserve/features/reservations/wizard/...` where selects default to `undefined` when options are missing.

## Constraints & Risks

- Table inventory creation should still enforce required zone selection; we must not submit invalid zone IDs.
- Some venues might have no zones configured yet, so we need a graceful disabled state that nudges them to create zones rather than crashing.
- `defaultValue=""` will still trigger the runtime guard even if we fix the empty `SelectItem`, so we must let it be `undefined` when the options list is empty.

## Open Questions (and answers if resolved)

- Q: Are zones guaranteed to exist for every restaurant?  
  A: No — the UI allows managing tables before defining zones, so we must handle the empty list.
- Q: Can we rely on the placeholder to communicate the empty state instead of adding a dummy item?  
  A: Yes, we can disable the select and add helper text to inform the user to create zones first.

## Recommended Direction (with rationale)

- Remove the sentinel `<SelectItem value="">` and instead render a descriptive message while disabling the select when `zoneOptions` is empty.
- Change the `defaultValue` to `zoneOptions[0]?.id ?? undefined` so the component never receives an empty string.
- Optionally add helper copy near the control (or inline within the dropdown) guiding ops to configure zones first.
