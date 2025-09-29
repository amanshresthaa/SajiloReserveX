# Dashboard Auth Guard — Plan

## Goal

Implement Story A1: gate `/dashboard` behind Supabase authentication while preserving existing middleware behavior and set up the authed route scaffolding.

## Implementation Steps

1. **Middleware Update**
   - Reuse `getMiddlewareSupabaseClient` to fetch the session once.
   - If the request path matches `/dashboard` (or sub-paths) and no session exists, redirect to `/login`.
   - Otherwise, continue returning `NextResponse.next()` (after the session refresh call).
   - Add a `matcher` config that targets `/dashboard/:path*` in addition to current behavior, ensuring other routes still get session refresh.

2. **Route Structure**
   - Create `app/(authed)/dashboard/layout.tsx` (client entry not required) that can host shared UI for authed routes; placeholder that renders children and maybe a heading stub per DoD.
   - Create `app/(authed)/dashboard/page.tsx` with minimal scaffold (header + “New booking” button linking to `/reserve`) per Story A1 skeleton requirement.

3. **Navigation Link (conditional)**
   - Locate existing navigation (search `components` or layout) and add a `/dashboard` link that only renders when a Supabase session is present (if infrastructure exists). If no nav component exists yet, document todo; spec says “Add link from nav (if present) conditioned on session”.

4. **Smoke Test Guidance**
   - Document how to run a manual smoke test (hitting `/dashboard` when logged in vs anon) in task notes.

## Verification

- Typecheck (if time allows) and ensure middleware logic compiles.
- Manual test instructions noted for QA.
