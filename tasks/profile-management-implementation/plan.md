# Plan — Implement authenticated profile management

## 1. Backend API surface

- Create `app/api/profile/route.ts` with `GET`/`PUT` handlers:
  - Use `getRouteHandlerSupabaseClient` for session auth and `getServiceSupabaseClient` when a default row must be inserted.
  - On `GET`, fetch the caller’s profile (`select(...).maybeSingle()`); if missing, seed a default row `{ id, email, name: null, image: null }`, then return normalized payload `{ id, email, name, image, createdAt, updatedAt }`.
  - On `PUT`, accept JSON body validated via a shared Zod schema (trimmed `name`, optional `https` `image`). Reject attempts to mutate `email`. Update only allowed fields and set `updated_at = now()` via database trigger (or explicit update) while preserving `customer_id`, `price_id`, `has_access`.
  - Return consistent error JSON `{ code, message }` (400 validation, 401 unauthenticated, 403 for RLS denials, 404 if row still missing, 500 fallback) without leaking PII.
- Extract reusable Zod schema + normalizers to `reserve/shared/utils/profile.ts` (or new `lib/profile/schema.ts`) so both API and client share validation rules.
- Add upload endpoint `app/api/profile/image/route.ts`:
  - Require auth, parse `FormData` with a single `file` entry.
  - Validate MIME (`image/`), limit size (e.g., ≤2 MB), derive safe extension, and store file in Supabase Storage bucket `profile-avatars/<userId>/<uuid>.<ext>` using `getServiceSupabaseClient().storage` with `upsert: true` after ensuring bucket exists (`createBucket` if absent, `public: true`).
  - Return `{ url, path }` from `getPublicUrl`, plus cache-busting token if needed.

## 2. Shared types & query keys

- Extend `lib/query/keys.ts` with `profile: { self: () => ['profile','self'] }` and adjust exported union type accordingly.
- Create TypeScript helpers (`types/profile.ts`) for DTOs: `Profile`, `UpdateProfilePayload`, `ProfileResponse` to keep API/client aligned.

## 3. Server routing & middleware

- Introduce `app/(authed)/profile/layout.tsx` mirroring dashboard shell but with profile-specific copy and breadcrumb back to dashboard.
- Build `app/(authed)/profile/manage/page.tsx`:
  - Server component that uses `getServerComponentSupabaseClient` to fetch session; redirect to `config.auth.loginUrl` if not authenticated.
  - Fetch profile via API helper (`fetchProfile` leveraging shared schema) and pass to client form as initial values. Ensure `metadata.title` describes the page.
- Update `middleware.ts` matcher to include `/profile/:path*` (and keep existing `/dashboard` logic). Ensure redirect honours `config.auth.loginUrl`.

## 4. Client form & upload UX

- Add `components/profile/ProfileManageForm.tsx` (client):
  - Build RHF form with Zod resolver, default values from props, and field trimming on submit.
  - Fields: read-only email, editable name, avatar uploader with preview + remove option. Integrate `Form`, `FormField`, `Input`, `Button` primitives.
  - Manage focus: when `formState.errors` changes, programmatically focus the first invalid input using `form.setFocus`.
  - Submit handler: if new file selected, call `/api/profile/image` via `fetch` with `FormData`, obtain URL, then call `/api/profile` `PUT` with `fetchJson`. Disable submit only while mutation pending, show spinner but keep label text per guidelines; toast successes/errors via `react-hot-toast` and update React Query cache (`invalidate profile.self`).
  - Provide `aria-live="polite"` status region for success messages and inline errors via `FormMessage`.
  - Ensure `touch-action: manipulation` (already in button variants) and `-webkit-tap-highlight-color` via global styles if needed.
- Add `components/profile/ProfileImageUploader.tsx` helper for file preview + validations (drag-and-drop optional) with accessible drag state, `aria-describedby`, and fallback initials when no image.
- Create client hooks:
  - `hooks/useProfile.ts` for fetching `/api/profile` (React Query).
  - `hooks/useUpdateProfile.ts` for mutation logic (reuse in form; manage toasts + cache invalidation).
- Update `components/mobile/BottomTabs.tsx` to direct “Profile” tab to `/profile/manage` (or ensure stub links there). Adjust `app/(mobile)/profile/page.tsx` CTA to `Link` to `/profile/manage`.

## 5. Documentation & env notes

- Document feature in `docs/profile-management.md`: outline API contract (GET/PUT + image upload), validation rules, storage bucket expectations, auth redirect behaviour, and test commands.
- Note that `profile-avatars` bucket must exist or will be created automatically; include guidance on Supabase console verification and env vars (none new expected).

## 6. Testing & verification

- Unit tests (Vitest) for shared profile schema/normalizer (valid/invalid cases) and API handlers (mock Supabase client to cover 401, default insert, happy path update, validation failure). Place under `tests/profile/api.test.ts`.
- Component tests with Testing Library (`tests/profile/ProfileManageForm.test.tsx`) verifying:
  - Initial values render, email read-only.
  - Validation errors appear and focus shifts to first error when submitting invalid input.
- Playwright E2E spec `tests/e2e/profile.manage.spec.ts` to smoke-test authenticated flow (stub login helper or mark needed fixtures). Ensure it at least covers redirect for unauthenticated user and happy path update (use test user credentials / skip if env missing).
- Add verification checklist in `tasks/profile-management-implementation/todo.md` and run `pnpm lint`, `pnpm typecheck`, `pnpm test` (and document if some steps require env setup).

## 7. Integration updates & polish

- Ensure `ButtonSignin` or other entry points link to `/profile/manage` where appropriate.
- Consider caching-busting query parameter appended to new avatar URLs to avoid stale image after upload.
- Review for accessibility (focus ring, aria labels, skip link) and responsive layout (simulate at 393px & desktop, ensure no overflow).

## Assumptions / pending confirmations

- `price_id` remains backend-managed; API does not expose it.
- Email immutability enforced server-side by ignoring/ rejecting changes.
- Supabase Storage service key available at runtime; bucket creation permitted.
