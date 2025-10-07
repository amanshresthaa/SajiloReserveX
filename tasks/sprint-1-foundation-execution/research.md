# Sprint 1 – Foundation & Infrastructure

_Task slug_: `sprint-1-foundation-execution`  
_Date_: 2025-01-13

## Sprint Context & Backlog Sources

- Core sprint scope already defined in `tasks/customer-frontend-architecture/sprint-plan.md` (S1–S9 stories with estimates/acceptance references).
- Supporting specs (requirements, IA, analytics, a11y, etc.) remain in the same folder hierarchy (`tasks/customer-frontend-architecture/*.md|ts|json`); treat them as authoritative for copy, flows, and acceptance criteria.
- Velocity target 45–50 pts → Stories S1–S7 are must-have (38 pts); S8–S9 stretch.
- Daily ceremonies + logging are expected (see `agents.md` guidelines).

## Tech Stack Snapshot

- **Next.js 15 / React 19** app router living in `app/` with shared providers (`app/providers.tsx`) wiring React Query + DevTools.
- **Reserve micro-frontend** (`reserve/`) uses Vite + Feature-Sliced Design:
  - Layers: `app`, `pages`, `features`, `entities`, `shared`.
  - Wizard modules live under `reserve/features/reservations/wizard`.
- **TypeScript** strict-ish; path aliases configured in `tsconfig.json` & `next.config.js` (`@shared`, `@features`, etc.).
- **Styling**: Tailwind v4 (`app/globals.css`, `tailwind.config.js`) with custom CSS variables honoring design tokens from architecture spec.
- **UI primitives**: shadcn-style components in `components/ui` and mirrored set for the reserve app in `reserve/shared/ui`.

## State & Data Patterns

- **React Query**: default options centralised (`app/providers.tsx`, `reserve/app/providers.tsx`).
- Shared query helpers in `reserve/shared/api`:
  - `client.ts`: fetch wrapper with timeout, JSON parsing, typed errors.
  - `queryKeys.ts`: reserved keys for caching.
- Reservations API hooks: `reserve/features/reservations/wizard/api/*.ts` using adapters from `reserve/entities/reservation`.
- Supabase browser client factory in `lib/supabase/browser.ts`; expect similar server helpers elsewhere (`lib/supabase`).

## Feature Patterns to Reuse

- **Reservation wizard** already implemented with DI context (`reserve/features/reservations/wizard/di`), hooks (`useReservationWizard`, `useDetailsStepForm`), UI steps under `ui/steps`.
- **Reservation detail page** (`app/reserve/[reservationId]/ReservationDetailClient.tsx`) showcases:
  - Analytics tracking via `track` and server-side emitters.
  - Offline detection (`useOnlineStatus`), share/download helpers (`lib/reservations/share.ts`).
  - JSON-LD generation, accessible focus handling, optimistic states.
- **Restaurant browser** component (`components/marketing/RestaurantBrowser`) covered by tests in `reserve/tests/features/restaurant-browser.test.tsx`.

## Analytics & Observability

- Frontend analytics helper: `lib/analytics.ts` (Next) + `reserve/shared/lib/analytics.ts` (reserve app) using Plausible provider.
- Events enumerated in helper unions; tests in `reserve/tests/features/wizard/*.analytics.test.tsx` ensure DI tracking.
- Server event emitter `lib/analytics/emit.ts` with Vitest coverage (`reserve/tests/unit/analytics.emit.test.ts`).
- Plausible integration already wired in `app/layout.tsx` (domain from `config.ts`).

## Design System & Tokens

- CSS tokens defined in `app/globals.css` (light/dark) with matching Tailwind extensions (`tailwind.config.js`).
- UI components follow shadcn anatomy (`components/ui/button.tsx`, etc.) + accessible defaults (focus-visible rings, aria-invalid states).
- Reserve app re-exports similar components via `@shared/ui/*` to keep duplication minimal.
- Check architecture design-tokens spec in `tasks/customer-frontend-architecture/07-design-tokens.json` for canonical values.

## Testing & Tooling

- **Unit/Component**: Vitest config in `reserve/vitest.config.ts`; coverage target ≥90% for core components (per sprint goals).
- **E2E/Component**: Playwright configs (`playwright.config.ts`, `playwright.component.config.ts`) ready for mobile-first testing.
- **Utilities**: `pnpm test`, `pnpm test:e2e`, `pnpm storybook`, etc. Node ≥20.11 & pnpm ≥9 enforced in `package.json`.
- Existing Vitest specs around reservation wizard analytics provide patterns for TDD when extending flows.

## Backend & Auth Hooks

- Supabase migration (canonical schema) in `supabase/migrations/20251006170446_remote_schema.sql`.
- Need to audit API routes under `app/api/*` (not yet reviewed) for booking endpoints aligning with hooks (`/bookings/:id` etc.).
- Authentication scaffolding expected via Supabase session; check `middleware.ts` & any `lib/auth` helpers for guards.

## Observed Gaps / Risks

- `tasks/` directory currently deleted in working tree; rely on `HEAD` versions for specs until restored.
- `scripts/check-no-shadcn.mjs` conflicts with current shadcn usage—verify CI expectations before running guard.
- No visible sprint tracker file yet (need to create/update as part of execution deliverables).
- Need confirmation on staging Supabase project credentials + Plausible domain for analytics validation.

## Open Questions

1. Do we restore the `tasks/customer-frontend-architecture` artifacts locally for reference or keep them virtual (read via `git show` only)?
2. Which branch should feature work target (create `feature/sprint-1-foundation` or reuse existing)?
3. Any existing CI pipeline definitions we must update (e.g., GitHub Actions, Vercel) to wire lint/test/build?
