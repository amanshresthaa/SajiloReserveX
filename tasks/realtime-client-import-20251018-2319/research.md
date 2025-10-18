# Research: Fix Build Failure From Missing Supabase Realtime Client

## Existing Patterns & Reuse

- `lib/supabase/browser.ts` and `lib/supabase/signOut.ts` live under the root `lib/` directory and are imported via the `@/lib/*` alias.
- The `tsconfig.json` path mapping for `@/lib/*` resolves to `./lib/*`, so anything imported with that alias should be placed under the root-level `lib/` tree.
- `useBookingRealtime` is the only consumer of `getRealtimeSupabaseClient`, and it expects the module to resolve via `@/lib/supabase/realtime-client`.

## External Resources

- [Next.js Module Not Found docs](https://nextjs.org/docs/messages/module-not-found) – confirms resolution fails when file path and alias mismatch.

## Constraints & Risks

- Keep the realtime Supabase client browser-only and compatible with existing Supabase configuration (environment variables already validated in build).
- Moving or renaming files must not break any other imports; need to ensure no other module references the old `src/lib/...` path.
- Minimal disruption: prefer relocating the file to match alias expectations rather than updating aliases broadly.

## Open Questions (and answers if resolved)

- Q: Are there any consumers using a relative path to `src/lib/supabase/realtime-client`?
  A: `rg` shows none; `useBookingRealtime` imports via alias only.
- Q: Does a `lib/supabase/realtime-client.ts` file already exist?
  A: No; only `browser.ts` and `signOut.ts` are present, so moving the file will not overwrite anything.

## Recommended Direction (with rationale)

- Move `src/lib/supabase/realtime-client.ts` into `lib/supabase/realtime-client.ts` so the existing alias (`@/lib/*` → `./lib/*`) resolves the module during the Next.js build.
- Update any exports/indexes if required, then rerun `pnpm run build` to confirm the module resolution succeeds.
