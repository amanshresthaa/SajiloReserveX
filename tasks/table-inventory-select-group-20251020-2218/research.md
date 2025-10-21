# Research: Fix Table Inventory Select Usage

## Existing Patterns & Reuse

- The shared select wrapper in `components/ui/select.tsx` re-exports Radix Select primitives and requires `SelectLabel` to live inside a `SelectGroup`.
- Other select menus in `src/components/features/tables/TableInventoryClient.tsx` render `SelectItem` elements directly and avoid `SelectLabel`; the only outlier is the empty-state branch for the zone selector.

## External Resources

- [Radix UI Select — Label](https://www.radix-ui.com/primitives/docs/components/select#label) — documents that `Select.Label` must be nested beneath `Select.Group`.
- [shadcn/ui Select docs](https://ui.shadcn.com/docs/components/select) — mirrors the Radix requirement and shows grouping via `SelectGroup` + `SelectLabel`.

## Constraints & Risks

- Retain the shadcn Select building blocks; avoid custom markup where primitives exist.
- Keep the zone select disabled when no zones are available and preserve the helper text shown below the field.
- Avoid introducing selectable placeholder values that could corrupt form submission or keyboard behaviour.

## Open Questions (and answers if resolved)

- Q: Do we still need an inline message inside the dropdown when the select is disabled?
  A: The message is redundant but harmless; placing it inside a `SelectGroup` satisfies Radix while keeping the helper text as the primary guidance.

## Recommended Direction (with rationale)

- Import `SelectGroup` in the table inventory client and wrap the disabled-state branch of the select content with it so the `SelectLabel` is in the required context.
- Leave the populated-state branch unchanged so existing behaviour and styling remain consistent.
