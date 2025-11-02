# Implementation Checklist

## Setup

- [ ] Add key + checksum utilities.
- [ ] Add policy version hash utility.

## Core

- [ ] Thread key + checksum through v2 repository + ledger update.
- [ ] DB migration: columns + composite unique index.
- [ ] Return `RPC_VALIDATION/IDEMPOTENCY_MISMATCH` on mismatch.

## Tests

- [ ] Deterministic hashing tests (ordering, stability).
- [ ] Integration retries vs mutation.

## Notes

- Assumptions: tenant = `restaurant_id`.
- Deviations: none.
