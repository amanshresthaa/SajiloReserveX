# Implementation Checklist

## Setup

- [x] Create task artifacts per AGENTS.md

## Core

- [x] Replace incorrect import in `scripts/debug-single-assignment.ts`
- [x] Update usage to `getServiceSupabaseClient`
- [x] Update to V2 capacity API (`quoteTablesForBooking` + `assignTableToBooking`)

## Tests

- [x] Run `npm run build` to validate

## Notes

- Assumptions: `getServiceSupabaseClient` is a drop-in for server-side scripts.
- Deviations: None.
