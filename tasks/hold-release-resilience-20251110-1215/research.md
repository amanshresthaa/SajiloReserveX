# Research: Atomic Hold Release & Observability

## Requirement

Align hold release with transactional consistency: deleting hold members and rows should happen atomically and emit an observability event so downstream pipelines get reliable signals.

## Findings

- `releaseTableHold` currently does two separate deletes via PostgREST (members then hold) and no telemetry.
- A failure between deletes leaves orphaned state, and there’s no structured record for ops.

## Proposed Solution

- Introduce a Postgres function `release_hold_and_emit` that deletes hold members + hold row inside a single transaction and records an observability event.
- Update `releaseTableHold` (and any other release helpers) to call this RPC and log warnings if it fails, falling back to legacy behavior if needed.
