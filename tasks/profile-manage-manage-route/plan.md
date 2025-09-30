# Plan for Repo-Aware Implementation Prompt

## 1. Confirm Repository Baseline for Prompt

- Summarise stack (Next.js 15 + React 19, Tailwind + DaisyUI + shadcn UI, Supabase auth/DB, Reserve Vite app) with references to `package.json`, `README.md`, `tailwind.config.js`, and `server/supabase.ts`.
- Note testing setup (Vitest, Playwright, lint/typecheck) and config patterns (`config.ts`, env readers) to ground prompt requirements.
- Call out design and accessibility expectations drawn from Tailwind tokens and global guidelines; highlight existing UI primitives for forms and buttons.

## 2. Decompose `/profile/manage` Feature Requirements

- Define user story: authenticated user edits profile (name, email, avatar URL, marketing opt-in?) referencing `database/database.sql` + Stripe webhook usage; flag mismatch with `types/supabase.ts` (needs regen or manual patch).
- Determine routing strategy: use `app/(authed)/profile/manage/page.tsx` (server component) or client? Confirm need to extend `middleware.ts` matcher and possibly add layout fallback for `/profile` group.
- Identify backend needs: Next.js route handlers under `app/api/profile` for GET/PUT or server actions; ensure Supabase RLS compliance and session handling (`getRouteHandlerSupabaseClient`). Consider concurrency/idempotency (use `updated_at` or UPSERT?).
- Outline frontend architecture: server component fetch initial profile, pass to client form built with `react-hook-form` + Zod via `@hookform/resolvers`; use `components/ui` primitives for accessible form, `components/ui/button` for submit, `react-hot-toast` for feedback. Address focus management & keyboard support per guidelines.
- Plan for responsive/mobile integration: reuse existing `/profile` mobile screen as entry point; add CTA to new manage page and ensure skip links/focus states.

## 3. Security, Validation, and UX Considerations

- Enforce auth checks (redirect to `config.auth.loginUrl` when unauthenticated). Confirm CSRF posture for POST/PUT (Supabase session cookie + Next route).
- Validation rules: `name` min length, `email` format (maybe read-only if Supabase canonical), optional avatar URL validated with URL schema. Encourage trimming inputs per global guidelines.
- Accessibility/performance: maintain 24px hit targets, focus rings, loading states. Use `aria-live` for success/error toasts or inline errors.

## 4. Testing & Documentation Expectations

- Specify unit/integration tests: e.g., Vitest tests for API handler (mock Supabase client) and React Testing Library tests for form interactions. Mention Playwright scenario for e2e coverage.
- Document env/config updates: update `docs/` or README if new env var introduced; add migration note if Supabase types regenerated.
- Provide acceptance criteria plus detailed test cases (cover success, validation error, unauthorized, server failure, RLS deny).

## 5. Output Structure & File Hints

- Prepare final response sections per prompt requirement: Title, Repo analysis summary, Implementation prompt (step-by-step), Acceptance criteria, Suggested test cases, File hints/locations.
- Within Implementation prompt, enumerate backend/frontend tasks with explicit file references (e.g., `app/(authed)/profile/manage/page.tsx`, `app/api/profile/route.ts`, `middleware.ts`, `types/supabase.ts`).
- Include reminders to regenerate Supabase types and update navigation components (`components/mobile/BottomTabs.tsx`, `components/Header.tsx` if needed).

## Double-Check & Alternative Paths

- Validate assumption of server route vs server actions—note alternative (server action inside page) and justify recommended choice.
- Highlight fallback if types regeneration not feasible (type augmentation via module declaration).
- Ensure plan prompts to verify profile data set from auth session and consider caching (TanStack Query?).
