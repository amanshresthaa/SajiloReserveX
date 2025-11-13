---
task: consolidate-auto-assign-algos
timestamp_utc: 2025-11-12T19:09:00Z
owner: github:@codex-ai
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Consolidate Auto-Assign Algorithms

## Requirements

- Collect every active auto-assignment algorithm implementation across the backend and operational scripts so they can be referenced together without hunting through multiple directories.
- Capture the current configuration knobs, decision steps, environment assumptions, and supporting helpers that power each algorithm.
- Present the consolidated view as a single JSON artifact that can be consumed by tooling or teammates who just need the decision logic in one place.

## Existing Patterns & Reuse

- The booking auto-assign job lives in `server/jobs/auto-assign.ts` and orchestrates retries, hold quoting, and confirmation when a booking is created/modified.
- High-throughput stress-test scripts (`scripts/ops-auto-assign-ultra-fast.ts` and `scripts/ops-auto-assign-ultra-fast-loop.ts`) layer on `quoteTablesForBooking`, RPC transitions, and strategies for adjacency, parallelism, and cloning flows.
- A lightweight helper (`server/booking/auto-assign/cancellable-auto-assign.ts`) wraps AbortController for timed operations, and the staff APIs under `src/app/api/staff/auto` expose quoting/confirmation endpoints backed by the same core services.

## External Resources

- No external docs; this is purely a repo-internal consolidation task.

## Constraints & Risks

- This work is documentation/metadata only—no behavior changes are allowed, and the JSON must stay in sync with the actual code paths.
- Too much detail may make the JSON hard to read; balance completeness with readability.
- Ensure we do not accidentally introduce secrets while describing env-driven configs.

## Open Questions (owner, due)

- None.

## Recommended Direction (with rationale)

- Record each auto-assign implementation with purpose, trigger, config, dependencies, and high-level steps.
- Include references to the key environment flags and helper functions so readers can jump to the real code if needed.
- Keep everything under one JSON file stored in `docs/` for easy discovery, and document the source files in `plan.md`/`todo.md` so reviewers can trace the intent.
