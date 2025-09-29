# Plan — Comprehensive Review for `/reserve` & `/dashboard`

## Objective

Deliver a sprint review report that covers categories (1–17) for the `/reserve` reservation flow and `/dashboard` bookings management surface, rooted in code inspection and supporting evidence.

## Step Breakdown

1. **Architecture & Context Synthesis**
   - Reconcile repository-level architecture notes (README, research summary) with concrete implementations (`app/reserve/page.tsx`, `reserve/app/*`, `app/(authed)/dashboard/*`).
   - Confirm integration points (feature flag, shared providers, TanStack Query usage) and capture key design decisions with file/line references.
2. **Feature Inventory & Status Assessment**
   - Enumerate reservation wizard capabilities (steps, reducer, API hooks) and dashboard operations (table view, edit/cancel flows) including completion status (e.g., placeholder detail page).
   - Note dependencies (shared hooks, APIs, analytics) and identify supporting files per feature.
3. **Cross-Cutting Quality Review**
   - Evaluate code organization, naming, documentation, error handling, duplication, and adherence to patterns by sampling representative modules from both surfaces.
   - Inspect testing artifacts (`reserve/tests`, Playwright specs) and CI scripts to judge coverage and gaps.
4. **Data & API Analysis**
   - Trace `/api/bookings` and `[id]` handlers to summarize endpoints, authentication expectations, validation, and data models (Supabase tables, adapters).
   - Capture database/migration posture (presence of `database/`, `current.sql`) and how reservation data is normalized.
5. **Metrics, Dependencies, and Risks**
   - Extract dependency insights from `package.json`, highlight outdated/vulnerable concerns if apparent, and collect counts/LOC approximations if feasible.
   - Identify explicit TODOs (`rg TODO`) and incomplete work mentioned in code (e.g., reservation detail placeholder).
6. **Draft & Validate Report**
   - Compose final narrative structured per categories 1–17 plus executive summary, embedding file:line references and evidence.
   - Cross-verify critical claims using at least two independent sources (e.g., code + tests, code + README) and document any residual uncertainties or verification gaps before finalizing.

## Verification Guardrails

- Apply “triple check” discipline: for each major conclusion, corroborate using multiple artifacts (code, tests, docs, commands).
- Re-run targeted `nl`/`sed` commands if additional line numbers are required during drafting.
- Maintain accessibility/performance checklist awareness for UX commentary (especially focus handling, query caching, skeletons).

## Open Questions to Resolve During Drafting

- Clarify authentication expectations for dashboard/my bookings API (derive from `reserve/tests/unit/my-bookings-api.test.ts` and `server/supabase.ts`).
- Determine whether any migrations exist in `database/` relevant to reservations.
- Decide how to estimate sprint metrics (LOC, feature completeness) given absence of automated stats—likely qualitative, noting limitations.
