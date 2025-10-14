# Research: Fix my-bookings route import

## Existing Patterns & Reuse

- Next.js auto-generated `.next/types/validator.ts` performs route type validation by importing each `app` segment using `.js` extensions.
- Current project keeps the primary Next App Router tree under `app/(...)` at the workspace root (not under `src`).
- Similar build tooling existed before without issue, suggesting configuration drift after recent Next.js upgrade.

## External Resources

- [Next.js 15 `srcDir` flag](https://nextjs.org/docs/app/api-reference/next-config-js/experimental#srcdir) — documents opting out when `app/` is not nested under `src/`.

## Constraints & Risks

- Multiple directories (`src/`, `reserve/`, `app/`) coexist; toggling `srcDir` must not break other imports relying on `src` aliasing.
- TypeScript path resolution must continue to cover both root-level and `reserve` modules.
- Need to confirm any tooling or tests expecting `src/app` paths; change might surface additional path assumptions.

## Open Questions (and answers if resolved)

- Q: Why does `validator.ts` reference `../../src/app/...` when routes live at `app/`?
  A: Next 15 assumes `srcDir: true` when a `/src` folder exists, unless explicitly disabled via `experimental.srcDir`.
- Q: Are other routes affected beyond `my-bookings`?
  A: Yes—`validator.ts` lists every route under the `../../src/app/...` path; build stops at the first missing module.

## Recommended Direction (with rationale)

- Explicitly disable the `srcDir` heuristic in `next.config.js` (`experimental.srcDir = false`) so Next.ts route validation points to the actual `app/` directory. Keeps project structure intact without duplicating files or adding shim `.js` modules.
