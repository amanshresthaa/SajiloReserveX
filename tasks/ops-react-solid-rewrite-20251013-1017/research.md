# Research: Ops React SOLID Rewrite

## Existing Patterns & Reuse

- **Next.js App Router**: Ops experience lives under `app/(ops)/ops/(app)/…` with server components fetching Supabase session/memberships (e.g., `layout.tsx`, `page.tsx`). We can reuse routing and auth boundaries but should move feature logic into dedicated containers/hooks.
- **Shadcn UI kit**: Stored under `components/ui`. Provides alerts, buttons, cards, sidebar primitives etc. Should continue using these primitives instead of reinventing.
- **Feature components**: Current feature code sits in `components/ops/*` (dashboard, bookings, team, restaurant-settings). Many files mix data fetching, state, and rendering (e.g., `TodayBookingsCard.tsx` ≈700 LOC). Good candidate to break into container (hooks + services) + presentational pieces.
- **Hooks & Services**: Domain-specific hooks in `hooks/useOps*` rely on React Query + REST API routes (`/api/ops`). Server-side Supabase logic under `server/ops`. These server utilities can migrate into `src/services` so we avoid duplicating SQL and validation.
- **API Routes**: `/app/api/ops/*` implement booking CRUD, customer exports, etc., and already encapsulate validation with `zod`. We should reorganize handlers to call new `services` layer but retain validated schemas.
- **Types**: Supabase types under `types/supabase` plus hook DTOs (e.g., `BookingDTO`). We can re-export consolidated domain types from `src/types`.

## External Resources

- [Next.js App Router docs](https://nextjs.org/docs/app) – confirm best practices for server/client component split and route conventions.
- [TanStack Query v5](https://tanstack.com/query/latest) – align our hooks with suspense, caching, pagination.
- [Supabase JS client](https://supabase.com/docs/reference/javascript/supabase-client) – ensure server/client Supabase usage remains correct.
- [Shadcn UI patterns](https://ui.shadcn.com/docs) – follow recommended composition for sidebar, dialog, table primitives.

## Constraints & Risks

- **Large surface area**: Rewriting dashboard, bookings, customers, team, and settings is substantial; need incremental, testable structure and guardrails to avoid regressions.
- **Supabase coupling**: Server utilities depend on Supabase row formats. Any refactor must preserve data mappings and column selections; risk of schema drift if we inline queries.
- **Auth/session**: Server components rely on Supabase session from cookies; moving logic must still respect Next.js server/client boundaries.
- **React Query hydration**: Bookings page prefetches data server-side. Reorganizing must maintain SSR hydration or risk flash/loading issues.
- **Timeline/complexity**: “Rewrite from scratch” but must keep functionality parity. Need phased delivery plan + feature toggles to limit downtime.
- **Mandatory MCP QA**: UI changes require Chrome DevTools manual QA before completion; must budget time.

## Open Questions (and answers if resolved)

- Q: Should we preserve existing API response shapes for `/api/ops/*`?
  A: Assumed yes to avoid backend contract changes; rewrite focuses on client architecture + service abstraction.
- Q: Is routing structure (`/ops/...`) staying untouched?
  A: Assume yes; Next.js route hierarchy should remain for SEO/bookmarked URLs.
- Q: Any new design guidelines beyond SOLID/React best practices?
  A: None provided; we’ll match current UX while improving code organization, accessibility, and state handling.

## Recommended Direction (with rationale)

- **Introduce `src/` domain architecture**: Move reusable code into `src/components`, `src/hooks`, `src/contexts`, `src/services`, `src/utils`, `src/types`. `app/(ops)` routes become thin wrappers importing from `src`.
- **Container/Presenter split**: For each feature (Dashboard, Bookings, Walk-in, Customers, Team, Settings) create container components that wire hooks/services, and presentational components under `src/components/features/<feature>`.
- **Custom hooks per concern**: Encapsulate business logic (`useTodayBookings`, `useBookingFilters`, `useOpsNavigation`) in `src/hooks`. Hooks should depend on services (abstractions) rather than fetch directly.
- **Services layer**: Wrap Supabase + REST interactions inside `src/services` (e.g., `bookingService`, `customerService`). Enables dependency injection/testing and aligns with Dependency Inversion.
- **Context for shared state**: Provide Ops-level context (selected restaurant, user account) once in layout to avoid prop drilling across pages.
- **Typed props**: Export feature-specific prop interfaces from `src/types/ops`. Ensure components accept minimal interfaces to satisfy Interface Segregation.
- **Progressive enhancement**: Keep server-side auth checks, but shift heavy UI logic to client containers using suspense-friendly data fetching.
- **Testing & QA**: Plan for React Testing Library unit tests per hook/component, plus manual MCP QA on major flows before release.
