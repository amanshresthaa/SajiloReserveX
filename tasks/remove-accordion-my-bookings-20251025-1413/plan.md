# Implementation Plan: Remove Accordion in My Bookings Edit

## Objective

We will enable users editing a booking to view and modify all fields without relying on an accordion so that the content remains visible via a scrollable container.

## Success Criteria

- [ ] Accordion elements removed from the edit view.
- [ ] Edit UI maintains functionality with a scrollable container providing access to all fields.

## Architecture & Components

- `components/dashboard/EditBookingDialog.tsx`: stop passing `timeAccordion`, add dialog height constraints/overflow to keep the form scrollable, and forward a new `timeScrollContainer` flag to the picker.
- `src/components/features/booking-state-machine/ScheduleAwareTimestampPicker.tsx`: support an optional scrollable wrapper for the inline time grid when `timeAccordion` is false.

## Data Flow & API Contracts

- No backend changes anticipated.

## UI/UX States

- Loading: existing behavior retained.
- Error: existing behavior retained.
- Success: edit form displays within a scrollable layout.

## Edge Cases

- Content overflow on smaller screens.

## Testing Strategy

- Update unit test expectations for `EditBookingDialog` to assert the new picker props.
- Manual verification of edit flow (`/my-bookings`) with Chrome DevTools MCP across viewports.

## Rollout

- No feature flag required; change applies immediately.
