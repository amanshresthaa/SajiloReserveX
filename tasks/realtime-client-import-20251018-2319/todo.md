# Implementation Checklist

## Setup

- [x] Confirm missing module location

## Core

- [x] Restore or adjust Supabase realtime client import path
- [x] Update exports/imports if necessary

## UI/UX

- [ ] N/A

## Tests

- [x] Run `pnpm run build` to verify resolution (subsequent type errors resolved via capacity typing fix)

## Notes

- Assumptions:
- Deviations: No additional barrel exports required after relocation. Follow-up capacity typing fix cleared the build pipeline.

## Batched Questions (if any)

- None
