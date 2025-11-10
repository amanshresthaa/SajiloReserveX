# Implementation Plan: Route Inventory Review

## Objective

Help the user manually review every accessible route so they can decide what to delete safely.

## Success Criteria

- [ ] Dev server runs without errors and is reachable in the browser.
- [ ] Authentication with the supplied credentials succeeds.
- [ ] Every route from the inventory list is opened (or attempted) with notes on success/fail states.

## Architecture & Components

- Next.js App Router handles most URLs; rely on built-in layouts.
- Use existing auth/pages flows; no new components.

## Data Flow & API Contracts

- Sign-in likely hits `/api/auth/callback` or Supabase auth endpoints; observe but do not modify.
- When loading each route, capture whether APIs 200/redirect/error to inform deletion decisions.

## UI/UX States

- Loading: native Next.js fallback states per route.
- Error: note any route returning 404/500.

## Edge Cases

- Auth-protected routes (e.g., `/ops/*`, `/my-bookings`) may redirect to login unless session exists.
- Dynamic routes (e.g., `/reserve/[reservationId]`) need valid params; document if data missing.

## Testing Strategy

- Manual navigation only; capture console/network anomalies.

## Rollout

- Not applicable; this is an investigative task.
