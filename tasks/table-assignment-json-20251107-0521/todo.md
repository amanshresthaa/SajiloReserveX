# Implementation Checklist

## Setup

- [x] Enumerate target files (`server/capacity/tables.ts` + `server/capacity/table-assignment/**/*.ts`) and lock order.
- [x] Ensure `context/` directory exists for the generated artifact.

## Core

- [x] Write/run Node one-liner that reads each file, builds `{ path: code }`, and writes `context/table-assignment-code.json` with sorted keys.
- [x] Add regeneration command comment (README snippet or script note if needed).

## UI/UX

- [x] Not applicable (documentation artifact only).

## Tests

- [x] Validate generated JSON via `jq 'keys' context/table-assignment-code.json` to ensure it parses successfully.

## Notes

- Assumptions: Artifact scope limited to backend table-assignment engine; front-end references excluded unless requested later.
- Deviations: Added `context/README.md` so regeneration instructions live next to the artifact.

## Batched Questions (if any)

- None at this time.
