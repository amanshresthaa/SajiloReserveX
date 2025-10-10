# Implementation Checklist

## Setup

- [x] Create task scaffolding and capture research/plan context
- [x] Review existing Ops dashboard patterns and membership helpers

## Core Functionality

- [x] Add Ops-specific query keys plus `useOpsBookings`, `useOpsUpdateBooking`, `useOpsCancelBooking`
- [x] Implement GET/PATCH/DELETE handlers under `/api/ops/bookings` with membership enforcement and tests
- [x] Build `/ops/bookings` server page and client managing restaurant selection, table, dialogs

## UI/UX

- [x] Wire bookings table with Ops mutations and loading/error states
- [x] Update Ops sidebar/title logic for the new manage view and adjust call-to-action placement

## Testing

- [x] `pnpm vitest run app/api/ops/bookings/route.test.ts app/api/ops/bookings/[id]/route.test.ts`
- [x] `pnpm run build`

## Documentation

- [x] Update task docs (research, plan, todo, verification)

## Questions/Blockers

- None at this time
