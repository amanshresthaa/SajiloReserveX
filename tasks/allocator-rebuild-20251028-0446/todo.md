# Implementation Checklist

## Phase 0 — Discovery

- [x] Inventory allocator entry points (manual & auto APIs, schedulers, cron jobs)
- [x] Map all database touchpoints (tables, RPCs, triggers, policies)
- [x] Collect pain points / error telemetry (duplicates, adjacency, holds)

## Phase 1 — Design

- [x] Define design deliverables (architecture doc outline, review process)
- [x] Produce architecture document & sequence diagrams
- [x] Define data model changes and migration strategy
- [x] Specify API contracts, error codes, and flag strategy
- [ ] Review plan with stakeholders (eng, ops, product)

## Phase 2 — Implementation

- [ ] Build planner service abstraction (reuse/extend selector)
- [ ] Implement assignment orchestrator + repository interface
- [ ] Add Supabase persistence implementation / migrations
- [ ] Update manual + auto API routes behind feature flag
- [ ] Instrument telemetry, logging, metrics

## Phase 3 — Verification

- [ ] Unit & integration tests covering merges, conflicts, retries
- [ ] Shadow run against production data (read-only)
- [ ] Manual QA via Chrome DevTools MCP & Playwright
- [ ] Define rollback and support playbook

## Phase 4 — Rollout

- [ ] Staging deployment & validation checklist
- [ ] Progressive flag rollout & monitoring
- [ ] Retire legacy allocator once metrics stable

## Notes

- Assumptions:
  - Supabase remains source of truth; we can author migrations/SQL with coordination.
  - Feature-flagged rollout is acceptable.
- Deviations:
  - TBD
