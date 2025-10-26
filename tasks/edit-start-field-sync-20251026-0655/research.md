# Research: Edit Start Field Sync

## Existing Patterns & Reuse

- `EditBookingDialog.tsx` uses `react-hook-form` with a Zod resolver (`EditBookingDialog.tsx:48-58, 100-114`). The `start` field requires a non-empty ISO string.
- The dialog wires `ScheduleAwareTimestampPicker` via a `Controller`, passing `value={field.value || null}` and `onChange={(next) => field.onChange(next ?? '')}` (`EditBookingDialog.tsx:270-283`).
- Date changes call `handleDateChange`, which uses `setValue('start', '', { shouldValidate: true, shouldDirty: true, shouldTouch: true })` to clear the field (`EditBookingDialog.tsx:189-206`).
- `ScheduleAwareTimestampPicker` invokes `onChange(iso)` once a slot is selected through `commitChange` (`ScheduleAwareTimestampPicker.tsx:182-204, 490-497`), so consumers should receive a full ISO string.

## External Resources

- [React Hook Form `setValue` documentation](https://react-hook-form.com/docs/useform/setvalue) — explains `shouldValidate` / `shouldTouch` flags, which we already rely on when clearing the field.
- [React Hook Form validation modes](https://react-hook-form.com/docs/useform) — confirms default `mode` is `'onSubmit'` but `resolver` runs on `onChange` if `reValidateMode` allows or `shouldValidate` is set.

## Constraints & Risks

- After clearing the field via `setValue(...'', shouldValidate: true)`, `react-hook-form` holds an error until validation runs again. `field.onChange(next)` does not automatically re-trigger validation if the mode is `'onSubmit'`, which could leave stale errors.
- Relying solely on `field.onChange` may skip `shouldValidate`, so the resolver might not clear the error even when the value updates.
- We must avoid double-updating form state; `Controller` expects `field.onChange`, but we can wrap it to ensure validation and dirty/touch state stay accurate.

## Open Questions (and answers if resolved)

- Q: Does the picker emit a full ISO string?  
  A: Yes—`commitChange` constructs an ISO using `toIsoString` and passes it to `onChange`, which our vitest suite already asserts contains the time component.
- Q: Why doesn’t the error clear automatically?  
  A: Because the form was marked invalid via `setValue(... shouldValidate: true)` when the date changed, but the subsequent `field.onChange` lacks `shouldValidate`, leaving the resolver’s error in place.
- Q: Is the error only stale UI, or is the form value still blank?  
  A: Value is updated (UI shows selected time); the mismatch indicates form state is dirty but error not cleared—pointing to missing revalidation after onChange.

## Recommended Direction (with rationale)

- Wrap the picker’s `onChange` in `EditBookingDialog` so we call `setValue('start', next ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true })` alongside `field.onChange`. This forces validation to re-run whenever the picker emits a value.
- Optionally call `clearErrors('start')` after a valid ISO to ensure the UI reflects the corrected state.
- Add targeted tests (likely via `react-hook-form` integration) to guarantee the error disappears once a valid slot is selected.
