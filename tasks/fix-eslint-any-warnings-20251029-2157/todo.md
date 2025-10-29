# Implementation Checklist

## Setup

- [x] Update `DbClient` aliases in targeted modules to `SupabaseClient<Database, "public">`.
- [x] Define strong types/guards for Supabase join data (`table_hold_members`) and RPC assignment rows.
- [x] Add booking payload validator in transaction flow to replace `as any` usage.

## Core

- [x] Refactor `server/capacity/holds.ts` to map members/assignments without `any`.
- [x] Refactor `server/capacity/transaction.ts` to consume typed booking payloads and optional chaining.
- [x] Refactor `server/feature-flags-overrides.ts` Supabase client typing.

## Verification

- [x] Run `pnpm lint` (or targeted eslint command) to ensure zero warnings.

## Notes

- Assumptions: Capacity RPC returns objects with `table_id`, `start_at`, `end_at`; booking payloads include `id` & `restaurant_id` when present.
- Deviations: Touched `server/capacity/tables.ts` to satisfy `import/order` lint that surfaced during verification run.
