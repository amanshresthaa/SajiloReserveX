# Research: Seed Cleanup for Waterbeach/White Horse Only

## Requirements

- Functional:
  - Remove redundant seed SQL variants and helper scripts that still reference the legacy multi-restaurant dataset.
  - Ensure the remaining seeding/reset scripts exclusively provision the White Horse Pub (Waterbeach) data set.
  - Preserve at least one canonical seed entry point for local/dev/staging resets (likely `supabase/seed.sql`) and any Waterbeach-specific utilities already in use.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Supabase scripts must remain idempotent and safe to run remotely per repo policy.
  - Keep documentation minimal but accurate so future resets don’t accidentally bring back other venues.

## Existing Patterns & Reuse

- `supabase/seed.sql` is the main multi-stage seeding script; it currently enumerates eight restaurants (see Stage 4) and seeds supporting tables.
- Waterbeach-only workflows already exist via `supabase/utilities/{reset-for-waterbeach,init-seeds-waterbeach}.sql` plus `supabase/seeds/cleanup-keep-only-waterbeach.sql`.
- Additional helper SQL files under `supabase/seeds/` provide alternative datasets (`intelligent-seed`, `schema-driven-seed`, `smart-bookings`, etc.) that we can prune if they’re no longer required.

## External Resources

- Internal documentation `WATERBEACH_RESET_SUMMARY.md` explains how Waterbeach-specific scripts are chained together.

## Constraints & Risks

- Removing files must not break whatever automation references them (e.g., runbooks, CI scripts). Need to confirm no direct references remain in package scripts before deleting.
- Some `.bak`/`.legacy` snapshots might still be referenced by documentation. We should verify with `rg` to ensure dead before deletion.

## Open Questions (owner, due)

- Q: Are TypeScript helper scripts under `/scripts` still needed?  
  A: Assuming yes; user request explicitly called out "script , seeds files" but context implies SQL seeding scripts. Flagging assumption in plan (owner: AI, due: before implementation) and ready to adjust if clarified.

## Recommended Direction (with rationale)

- Normalize on a single White-Horse-only `supabase/seed.sql` by stripping other restaurants and any related fixture data, so there’s one canonical entry point.
- Delete obsolete `.bak`, `.legacy`, and alternative seed flavors plus documentation that no longer aligns, leaving only the Waterbeach-specific scripts already validated in `WATERBEACH_RESET_SUMMARY.md`.
- Update `restaurant.json` and any other seed metadata lists so they enumerate only the White Horse entry, preventing confusion for engineers running data exports.
