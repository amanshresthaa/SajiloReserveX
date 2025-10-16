# Implementation Checklist

## Setup

- [x] Confirm missing Shadcn UI modules and intended replacements

## Core

- [x] Update imports in capacity configuration components
- [x] Update imports in table inventory components

## UI/UX

- [x] Ensure components use available tokens/patterns

## Tests

- [x] Run `pnpm run build`

## Notes

- Assumptions:
- Deviations:
  - Addressed additional Next.js 15 type validation errors (route context typing, awaiting Supabase client) surfaced once build progressed.
  - Fixed capacity service exports (table types) and transaction logging severity to satisfy updated type checks.
  - Normalized override type sanitizer and capacity override service period mapping to comply with stricter TypeScript inference.

## Batched Questions (if any)

- ...
