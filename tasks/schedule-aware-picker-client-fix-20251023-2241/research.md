# Research: Schedule-Aware Timestamp Picker Client Directive Fix

## Existing Patterns & Reuse

- `src/components/features/booking-state-machine/TimestampPicker.tsx` is marked with `"use client"` and re-exported through the same feature index. This establishes the pattern for hook-heavy pickers.
- `components/dashboard/EditBookingDialog.tsx` is a client component that imports both `TimestampPicker` and `ScheduleAwareTimestampPicker` from the shared index, so aligning the directive keeps parity between the two.

## External Resources

- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components) – Directive reference

## Constraints & Risks

- The feature index (`src/components/features/booking-state-machine/index.ts`) re-exports server utilities alongside client components, so we must limit the `"use client"` directive to the picker file itself to avoid turning the barrel file into a client boundary.
- Adding the directive should not introduce additional bundle weight or break existing server-side consumers; Next.js already supports mixing via re-exports (as proven by `TimestampPicker`).

## Open Questions (and answers if resolved)

- Q: Does marking the picker file as client disrupt existing server imports of the barrel?
  A: No, because `TimestampPicker` already uses this pattern without issue.

## Recommended Direction (with rationale)

- Add the `"use client"` directive to `ScheduleAwareTimestampPicker.tsx`, mirroring the established pattern in `TimestampPicker.tsx`, so the build can succeed while preserving client-side hook usage.
