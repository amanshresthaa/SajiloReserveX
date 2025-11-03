# Implementation Plan: Auto Table Assignment

## Objective

Automatically assign a table post-booking (background) and surface confirmed vs pending in confirmation step without exposing table data.

## Success Criteria

- [ ] Background assignment attempts after booking creation
- [ ] Public status API returns assigned boolean only
- [ ] Confirmation step shows 'Pending' until assigned, then 'Booking confirmed'

## Architecture & Components

- server/capacity/auto.ts:
- API:
- Hook: amend to query status
- Wire-in: call auto-assign in

## Data Flow & API Contracts

Endpoint: GET /api/bookings/:id/assignments/status
Response: { assigned: boolean }
Errors: 404 if missing, 500 on server error

## UI/UX States

- Pending: spinner + pending copy
- Success: confirmed copy

## Edge Cases

- No suitable tables: remains pending
- Race conditions: idempotency in assignment call

## Testing Strategy

- Unit-light: validate API route returns boolean
- Manual QA: create booking, observe background attempt in logs, confirm UI status

## Rollout

- Feature flag not required; safe defaults
