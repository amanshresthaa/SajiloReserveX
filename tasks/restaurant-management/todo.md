# Implementation Checklist

## Setup

- [x] Review Supabase schema (`restaurant_operating_hours`, `restaurant_service_periods`, `restaurants`) and existing owner patterns
- [x] Create task scaffolding (research/plan/todo/verification)

## Core Functionality

- [x] Add server helpers for operating hours, service periods, and restaurant details
- [x] Implement owner API routes (`hours`, `service-periods`, `details`) with validation and tests
- [x] Build React Query hooks and mutations for restaurant management data

## UI/UX

- [x] Create management UI (weekly hours, overrides, service periods, details) with save flows
- [x] Add `/manage-restaurant` page with restaurant selector and prefetch
- [x] Provide dirty-state guard and accessible form controls

## Testing

- [x] `pnpm vitest run app/api/owner/restaurants/[id]/hours/route.test.ts app/api/owner/restaurants/[id]/service-periods/route.test.ts app/api/owner/restaurants/[id]/details/route.test.ts`
- [x] `pnpm run build`

## Documentation

- [x] Update task plan + research; record verification results

## Questions/Blockers

- None currently
