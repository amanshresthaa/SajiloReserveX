# Implementation Checklist

## Setup

- [ ] Implement `hashPolicy` and `computeContextVersion`.

## Core

- [ ] Extend `evaluateManualSelection` to return `policyVersion`.
- [ ] Persist `policyVersion` into hold metadata.
- [ ] Extend `getManualAssignmentContext` to return `contextVersion`.
- [ ] Update manual routes to require and verify `contextVersion`.
- [ ] Emit `POLICY_CHANGED` and `STALE_CONTEXT` with details.

## Tests

- [ ] Unit: hashing; policy drift detection.
- [ ] Integration: stale context prevention.
