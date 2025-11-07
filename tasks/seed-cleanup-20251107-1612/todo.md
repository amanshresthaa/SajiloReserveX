# Implementation Checklist

## Setup

- [x] Inventory supabase seed references (ensure nothing critical depends on soon-to-be-removed files).

## Core

- [x] Trim `supabase/seed.sql` to keep only White Horse, ensuring constraints still satisfied.
- [x] Delete obsolete seed/script backups (`supabase/seed*.bak*`, legacy variants, alternative seed recipes).
- [x] Update seed orchestration so only the Waterbeach dataset is loaded (kept `init-seeds.sql`, retargeted to `../seed.sql`).
- [x] Remove redundant SQL files under `supabase/seeds/` except `cleanup-keep-only-waterbeach.sql` and `white-horse-service-periods.sql`.
- [x] Update shared metadata (`restaurant.json`, docs if needed) to reference only White Horse.

## UI/UX

- [ ] N/A

## Tests

- [x] Run `pnpm lint`.

## Notes

- Assumptions: User intent is to prune SQL seed scripts; TypeScript helpers remain untouched.
- Deviations: Kept `supabase/utilities/init-seeds.sql` but re-pointed it at the canonical `supabase/seed.sql`.

## Batched Questions (if any)

- None.
