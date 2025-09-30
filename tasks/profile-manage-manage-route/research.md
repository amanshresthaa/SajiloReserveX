# Task Outline & Initial Hypotheses

- Objective: draft an implementation prompt for a `/profile/manage` feature that lets authenticated users view and edit their profile details.
- Subtasks considered:
  1. Understand global architecture (languages, frameworks, auth, routing, storage, design system, testing). Challenge assumption that this is a pure Next.js app by verifying presence of additional frontends (checked for Vite-based reserve app in `reserve/`).
  2. Identify existing profile-related patterns, data models, and API hooks. Validate whether a profile table exists (cross-checked Supabase schema files and server utilities).
  3. Gather UI conventions (form components, styling, validation) and confirm they align across desktop/mobile (looked at `components/ui` shadcn set and DaisyUI usage).
  4. Map testing approaches and config conventions to ensure the prompt references appropriate tooling (verified via `package.json`, `reserve/vitest.config.ts`, and Playwright setup).
- Potential misreads flagged early: assumed Prisma or NextAuth might be used; disproved by locating direct Supabase clients in `server/supabase.ts` and absence of Prisma packages.

# Repository Survey

- Languages & Frameworks
  - Verified via `package.json` and `README.md`: TypeScript-first Next.js 15 (app router) with React 19, plus a Vite-powered Feature-Sliced React app under `reserve/`.
  - Styling confirmed by `tailwind.config.js` showing Tailwind v4, DaisyUI-style tokens, and custom CSS variables; `components/ui` holds shadcn-based primitives.
- Auth System
  - `server/supabase.ts`, `middleware.ts`, and `app/signin/page.tsx` show Supabase Auth providing sessions. `middleware` currently protects `/dashboard` routes only.
  - Browser clients built via `@supabase/ssr` singleton in `lib/supabase/browser.ts`; route handlers exchange auth codes in `app/api/auth/callback/route.ts`.
- Data / ORM / DB
  - `types/supabase.ts` and `database/database.sql` confirm a Postgres schema managed through Supabase. No ORM; direct Supabase client queries in server utilities (e.g., `server/customers.ts`).
  - `database/migrations/index.sql` defines `public.profiles` with RLS enforcing user-specific access (`Users read/insert/update own profile`).
- Routing & Folder Structure
  - Next app router uses route groups such as `app/(authed)/dashboard` (gated) and `app/(mobile)` (mobile-first pages). Shell integrates Reserve app at `app/reserve/*` with feature flag per `README`.
  - API routes live under `app/api/*` with server-side Supabase access for Stripe, bookings, etc.
- Config & Environment Patterns
  - Global config centralised in `config.ts`; runtime env accessor patterns in `reserve/shared/config/runtime.ts` & `env.ts` employ Zod validation and fallbacks, suggesting parity for any new config keys.
  - Supabase env assertions throw on missing keys across server/browser helper files.
- Testing & Tooling
  - `package.json` scripts expose `pnpm test` (Vitest for reserve app), `pnpm test:e2e` (Playwright), `pnpm lint`, `pnpm typecheck`.
  - `reserve/vitest.config.ts` configures aliases and jsdom environment; root `tests/` folder includes integration/server/email specs outside reserve workspace.
  - ESLint enforced primarily on `reserve` per `next.config.js#L12`.
- Design System & UI Stack
  - DaisyUI utility classes across `components` (e.g., `btn`, `bg-base-100`); shadcn components in `components/ui`, with CVA-based `buttonVariants`. Tailwind variables defined in `tailwind.config.js` referencing design tokens from `agents.md`.
  - Mobile-specific primitives under `components/mobile/` (e.g., `PrimaryButton`).

# Profile-Related Existing Patterns

- Mobile stub page at `app/(mobile)/profile/page.tsx` renders static profile summary & “Edit profile” button (no data wiring). Suggests upcoming shared profile components.
- Database layer already stores user metadata in `public.profiles` (see `database/database.sql:565-575`) keyed by Supabase auth user IDs; Stripe integration updates that table in `app/api/stripe/*` route handlers.
- Supabase auth session retrieved client-side in `components/LayoutClient.tsx` for Crisp integration; no dedicated profile fetch hook yet.
- There is no `/profile` desktop route; middleware gating currently excludes it, so new route needs either updated matcher or alternate auth handling.

# Validation & Form Patterns

- React Hook Form used in `components/dashboard/EditBookingDialog.tsx` and `reserve` steps (`PlanStep.tsx`, `DetailsStep.tsx`). Zod validation integrated via `@hookform/resolvers` in several files (checked `reserve/features/.../schemas.ts`).
- Shadcn form helpers exist in `components/ui/form.tsx`, covering `<Form>`, `<FormField>`, `<FormItem>`, `<FormMessage>`, enabling accessible error handling.
- Toast feedback through `react-hot-toast` via `ClientLayout`; server errors typically mapped to toasts or inline messages.

# Security & Accessibility Constraints

- Global UI guidelines in the prompt require focus management, accessible forms, validation, and maintaining hit targets (reinforced by DaisyUI/Tailwind tokens).
- RLS policies for `profiles` require row-level `id = auth.uid()` filtering. Any server handlers must use authenticated Supabase client to avoid `PGRST301` errors.
- Middleware currently ensures `/dashboard` requires auth; new `/profile/manage` must align (likely expand matcher or add server-side redirect logic).

# Testing Observations

- Existing Vitest tests for store logic in `reserve`, but main Next app lacks unit tests—server routes validated under `tests/server`. For profile feature, we may leverage Testing Library (React 19 compatibility) or add integration tests hitting API route with Supabase client mocks.
- Playwright config indicates ability to add `/tests/e2e` scenarios (useful for new page load & form submission flows).

# Outstanding Questions / Edge Considerations

- Need to confirm desired profile fields: `database/database.sql` `profiles` table includes columns beyond `full_name`/`avatar_url`/`price_id`; prompt should enumerate editable subset vs read-only.
- Determine error-handling expectations when Supabase session missing—redirect, show login CTA, or handle via middleware.
- Clarify whether feature targets desktop layout, mobile layout, or both (existing stub only mobile). Implementation prompt should nudge for responsive design with shared components if possible.
- Should we reuse existing `profiles` updates in Stripe webhooks or centralise via server action? Need to mention concurrency/idempotency.

# Verification Notes

- Cross-checked frameworks via both `package.json` and `README.md` to avoid stale documentation mismatches.
- Verified Supabase usage through code search (`rg "getSupabase"`) and database schema declarations to ensure no alternate auth provider.
- Double-checked styling conventions by inspecting `tailwind.config.js` and actual component usage (e.g., `app/(authed)/dashboard/layout.tsx`).
- Confirmed lack of existing `/profile/manage` route by running `rg "/profile"` & verifying filesystem (`find app -maxdepth 3 -type d -name 'profile'`).

# Additional Observations After Double-Check

- Supabase type definitions in `types/supabase.ts` omit `name` and `image` columns present in `database/database.sql`. Either schema changed post-generation or types need regeneration; implementation prompt should flag this to avoid runtime type gaps.
