---
task: consolidate-auto-assign-algos
timestamp_utc: 2025-11-12T19:09:00Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Consolidate Auto-Assign Algorithms

## Objective

We will create a single JSON reference that describes every auto-assign algorithm/code path, enabling teammates to understand the booking auto-assignment behavior without opening multiple files.

## Success Criteria

- [ ] JSON artifact enumerates the job, scripts, and helpers currently responsible for auto-assignment.
- [ ] Each entry lists configuration knobs, triggers, dependencies, and the core steps executed.
- [ ] Task documentation (`research.md`, `todo.md`, `verification.md`) reflects the work for traceability.

## Architecture & Components

- `server/jobs/auto-assign.ts`: the default booking auto-assign job triggered by creation/modification hooks.
- `scripts/ops-auto-assign-ultra-fast.ts`: stress-test script with aggressive concurrency and reporting.
- `scripts/ops-auto-assign-ultra-fast-loop.ts`: loop runner that sequences assignment strategies and reserve-flow clones.
- `server/booking/auto-assign/cancellable-auto-assign.ts`: helper that bounds auto-assign steps with an abortable timer.
- `docs/auto-assign-algorithms.json`: consolidated metadata describing how the above pieces work together.

## Data Flow & API Contracts

1. Booking event triggers `autoAssignAndConfirmIfPossible` which quotes tables, holds them, and transitions a booking via RPC with idempotency.
2. Operational scripts iterate over bookings or cloned data, invoke quoting, confirm holds, and persist results while emitting reports.
3. The JSON collects these flows with references to environment flags, concurrency parameters, and strategy loops.

## UI/UX States

- Not applicable (documentation-only change).

## Edge Cases

- Ensure the JSON stays readable despite describing multiple files.
- Avoid misrepresenting a script's defaults (e.g., mention `SINGLE_ATTEMPT_ONLY` true) so the consolidated view matches reality.

## Testing Strategy

- Not applicable; no runtime behavior is touched. Will rely on human inspection of the JSON and existing scripts.

## Rollout

- Drop the new JSON into `docs/`; no release actions are required.
