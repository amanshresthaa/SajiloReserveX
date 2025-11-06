# Implementation Plan: Table Assignment Pitfall Analysis

## Objective

We will deliver a comprehensive pitfall assessment of the table auto-assignment system to inform stakeholders of risks and prioritize remediation work.

## Success Criteria

- [ ] Research document summarizes current architecture, data sources, and constraints
- [ ] Analysis report identifies top critical pitfalls with evidence and impact
- [ ] Recommendations include quick wins and long-term roadmap with risk assessment

## Architecture & Components

- Auto-assign entry (`server/jobs/auto-assign.ts`): orchestration, retries, observability
- Capacity planner (`server/capacity/tables.ts`, `selector.ts`, `holds.ts`): filtering, scoring, holds
- Database layer (`supabase/schema.sql`, migrations): assignment RPC, constraints, hold enforcement
- Feature flags (`server/feature-flags.ts`, `lib/env.ts`): runtime controls and configuration
- Observability (`server/observability`, analytics jobs): event logging and telemetry

## Data Flow & API Contracts

Entry points trigger `quoteTablesForBooking` → evaluate plans → create holds → `confirmHoldAssignment` → `assign_tables_atomic_v2` RPC. State transitions enacted via `apply_booking_state_transition`. Observability events record attempts/success/failure.

## UI/UX States

- N/A (analysis task)

## Edge Cases

- Bookings near service start cutoff
- Holds conflicting due to disabled strict mode
- Scarcity/strategic config cache staleness
- Reassignments when auto-assign fails but manual assignment proceeds

## Testing Strategy

- N/A (analysis deliverable)

## Rollout

- N/A (analysis deliverable)
