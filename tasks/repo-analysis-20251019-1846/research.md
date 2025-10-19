# Research: Repository Analysis

## Existing Patterns & Reuse

- **Next.js 15 app router** under `src/app` with route groups `(authed)`, `(customer)`, `(ops)`; layouts and providers (`src/app/layout.tsx`, `src/app/providers.tsx`) manage SEO, analytics, React Query hydration, and Crisp support wrappers (verified via `ls src/app` + `sed layout.tsx`).
- **Shared React component library** in `/components` (Shadcn-based primitives inside `components/ui`, marketing/ops/customer modules by domain) consumed through path aliases (`next.config.js`, `tsconfig.json`) – cross-check via `ls components` and alias definitions.
- **Server-side domain layer** lives in `/server`, organised by bounded contexts (`auth`, `reservations`, `restaurants`, `capacity`, `emails`, etc.); exported functions such as `getReservation` rely on Supabase clients and `reserve` entities for type-safe adapters (validated by inspecting `server/reservations/getReservation.ts`).
- **`reserve/` subproject**: Vite + React Router application with `features`, `entities`, `shared` domains that double as the booking wizard module for the Next.js app (`components/reserve/booking-flow/index.tsx` imports `@features/reservations/wizard/...`; confirmed aliases in `tsconfig.json` and `next.config.js`).
- **Supabase-first persistence**: consolidated SQL schema in `supabase/migrations/20251019102432_consolidated_schema.sql`, generated DB types in `types/supabase.ts`, and environment helpers in `lib/env.ts`; Upstash Redis integration hints via `env.cache`, and email via `server/emails`.
- **Extensive internal documentation** under `/documentation` (e.g., `SYSTEM_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`) and support artefacts (`VISUAL_ARCHITECTURE.md`, `MASTER_INDEX.md`) provide authoritative references for architecture, API, and schema.

## External Resources

- `documentation/SYSTEM_ARCHITECTURE.md` – existing high-level & layered diagrams for SajiloReserveX (used to cross-validate architectural findings).
- `documentation/DATABASE_SCHEMA.md` – detailed DB docs to compare with Supabase migration outputs.
- `openapi.yaml` – versioned REST API contract for `/api/v1`.
- Supabase SQL migration (`supabase/migrations/20251019102432_consolidated_schema.sql`) as canonical schema source.
- `VISUAL_ARCHITECTURE.md` & `COMPREHENSIVE_ROUTE_ANALYSIS.md` – supplementary diagrams & route mapping.

## Constraints & Risks

- **Process constraints**: Must follow AGENTS.md workflow (sequential phases, task folder artefacts, document deviations); Supabase must remain remote-only.
- **Dual frontend footprint**: Need to reason about both React Server Components (Next.js) and client-side Vite app while ensuring conclusions reflect shared module usage.
- **Large code surface** (~multiple domains, server + client) increases chance of missing niche modules; risk mitigated by systematic directory traversal (`ls`, `find`, `rg`) and cross-referencing docs.
- **Generated / backup assets** (`.next`, `.reserve-dist`, `globals.css` backups) could mislead analysis; focus on source directories.
- **Potential nested instructions**: `find -name AGENTS.md` returned only root – but must remain vigilant for task-specific overrides.

## Open Questions (and answers if resolved)

- **How is the Vite `reserve` app delivered to end-users?** Evidence suggests dual use: Vite standalone build via `reserve/vite.config.ts`, and re-used components in Next via path aliases. Need to confirm runtime embedding when analysing build/deployment narratives.
- **Are there additional backend runtimes beyond Next API routes?** Presence of `server/jobs`, `server/queue`, and cron artefacts hints at background processing. Must verify whether these run through Supabase Edge Functions, cron, or external worker at planning stage.
- **Which parts of documentation remain authoritative?** Documentation is dated (2025-01-15). Will cross-check each claim with current code during analysis to catch drift.

## Recommended Direction (with rationale)

- Use a **code-first sweep** (Next app, reserve app, server, supabase) corroborated by existing documentation to build trustworthy architectural maps.
- Map **component/module responsibilities** by domain (marketing vs reserve wizard vs ops) using alias traces to avoid duplicated descriptions.
- Derive **data flow** by connecting API routes (`src/app/api/v1/*`), server modules, and Supabase SQL definitions, validating via type imports and query usage.
- Capture **tech stack** by combining package manifests (`package.json`), config files, and env helpers; double-check with build scripts.
- For DB analysis, parse migration file for top-level tables/enums and triangulate with `types/supabase.ts`.
- Record each finding with the source (file path / doc) in notes to ease later verification and cite in final report.
