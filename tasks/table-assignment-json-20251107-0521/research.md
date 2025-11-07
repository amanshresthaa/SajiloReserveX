# Research: Consolidate Table Assignment Code

## Requirements

- Functional:
  - Produce a single JSON artifact that contains the up-to-date source code for every module that implements the table-assignment engine so downstream agents can ingest everything from one place.
- Non-functional (a11y, perf, security, privacy, i18n):
  - JSON must remain ASCII/UTF-8 so it is easy to transport.
  - Avoid redundant copies of giant files to keep repository weight reasonable (<1 MB delta ideally).
  - No secrets or environment-specific data should be embedded; the artifact is purely derived source.

## Existing Patterns & Reuse

- `server/capacity/table-assignment/` already isolates assignment logic across `assignment.ts`, `availability.ts`, `booking-window.ts`, `manual.ts`, `quote.ts`, `supabase.ts`, `types.ts`, `utils.ts`, and `constants.ts` (plus `index.ts` barrel export).
- `server/capacity/tables.ts` is the public facade; consumers import assignment helpers from there, so including that file will complete the picture for reviewers.
- No prior JSON snapshot exists, but the project already uses structured context dumps (`docs/table-assignment-business-rules.md`, task folders) showing precedent for curated reference artifacts.

## External Resources

- `docs/table-assignment-business-rules.md` – documents the rules enforced by the modules we are packaging, useful to cross-check completeness.
- `tasks/modularize-table-assignment-logic-20251106-1342/plan.md` – describes the current modular layout to validate which files belong in the bundle.

## Constraints & Risks

- Missing a module would make the JSON snapshot incomplete, defeating the purpose of consolidation.
- Naively embedding files without escaping would break JSON; we must rely on tooling (`JSON.stringify`) to encode newlines and quotes safely.
- Generated artifact could drift if not reproducible; document how to refresh it (script or instructions) to limit rot.

## Open Questions (owner, due)

- Q: Should UI/client-side helpers (e.g., `src/components/features/dashboard`) also be captured? (owner: eng, due: when follow-up requested)
  A: Assumed out-of-scope because the ask explicitly targeted “table assignment code,” which is isolated in `server/capacity/table-assignment/**` and surfaced via `server/capacity/tables.ts`.

## Recommended Direction (with rationale)

- Enumerate all `.ts` files under `server/capacity/table-assignment` plus the facade `server/capacity/tables.ts` in a deterministic list.
- Write a tiny Node script (or inline `node -e`) that reads each file, builds an object keyed by relative path with the full source string, and writes it to `context/table-assignment-code.json` using `JSON.stringify(..., null, 2)` for readability.
- Commit both the generated JSON and a note in the plan/todo describing how to regenerate so future updates stay consistent.
