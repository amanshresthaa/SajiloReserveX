# Implementation Checklist

## Setup

- [x] Create task folder and draft research/plan

## Core

- [x] Remove TimestampPicker usage and related state from `BookingActionButton`
- [x] Ensure `onMarkNoShow` call omits `performedAt` and cleanup still resets reason

## UI/UX

- [x] Tidy dialog spacing after removing the picker

## Tests

- [x] Evaluate need for test updates (adjust or document if none)

## Notes

- Assumptions:
- Backend defaults the no-show timestamp when `performedAt` is omitted.
- Deviations:
- None noted.

## Batched Questions (if any)

- None at this time
