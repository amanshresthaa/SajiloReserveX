# Research — Profile management implementation

## Data & Supabase access

- `database/database.sql:565-575` defines `public.profiles` with columns `id`, `name`, `email`, `image`, `customer_id`, `price_id`, `has_access`, `created_at`, `updated_at` plus FK to `auth.users`. RLS policies (`database/migrations/index.sql:807-838`) allow authenticated users to select/insert/update their own row.
- Generated types (`types/supabase.ts:578-606`) now expose `name` and `image`, so frontend can rely on `Database['public']['Tables']['profiles']`.`Row` having those fields.
- `server/supabase.ts` exports helpers: `getRouteHandlerSupabaseClient` for API routes (cookie-based auth), `getServerComponentSupabaseClient` for server components, `getServiceSupabaseClient` for service-role operations. No existing storage helper yet.

## API route patterns

- `app/api/bookings/route.ts` shows conventions: validate with Zod, use `getRouteHandlerSupabaseClient`, return `NextResponse.json`, log errors, and shape errors with descriptive messages. `lib/http/errors.ts` expects JSON responses with `{ message, code, details? }` to build `HttpError`.
- Authentication within routes typically checks `supabase.auth.getUser()` and returns early 401 (see `app/api/stripe/create-portal/route.ts:26-34`).
- Idempotent insert/update helper functions generally trim input and normalize data before upserting (e.g., `server/customers.ts`).

## Client-side data fetching & mutations

- React Query is wired through `AppProviders` and used via hooks: `useBookings` (GET) + `useUpdateBooking` (mutation). They rely on `fetchJson` for API calls and `queryKeys` helpers for cache invalidation.
- Notifications rely on `react-hot-toast` from `ClientLayout`. Mutations display `toast.success/error` and maintain button labels while showing loading state.
- There is no existing `useProfile` hook; we can mirror `useBookings` with `queryKeys.profile = { self: () => ['profile','self'] }`.

## Form & validation patterns

- UI primitives in `components/ui/` (button, input, textarea, form). Inputs already satisfy touch target guidelines (`min-h-[44px]`).
- Forms rely on `react-hook-form` with Zod resolvers (`components/dashboard/EditBookingDialog.tsx`, `reserve/features/.../PlanStep.tsx`) and manage focus on errors with `form.setFocus` using first field in error map.
- Field-level components (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) generate consistent accessible markup.
- Buttons maintain label while disabling during pending state (see `EditBookingDialog`).

## Routing & layouts

- Protected routes currently live under `app/(authed)/dashboard`. Middleware at `middleware.ts` gates `/dashboard/:path*` via Supabase session check and redirect to `/login` (alias for `config.auth.loginUrl`). We must extend this to `/profile/:path*`.
- There is no `app/(authed)/profile` directory. `app/(mobile)/profile/page.tsx` is a static stub with “Edit profile” CTA but no data wiring. Mobile navigation `components/mobile/BottomTabs.tsx` points `/profile` to that stub.
- Desktop layout uses `app/(authed)/dashboard/layout.tsx` with simple header + container; new profile layout can mirror style but copy should change.

## Image uploading considerations

- No existing Supabase Storage usage in repo (`rg "storage.from"` returns nothing). We'll likely need to introduce a `profile-avatars` bucket via `getServiceSupabaseClient().storage`.
- Ensure upload API validates file type/size and generates deterministic public URLs (`supabase.storage.from(bucket).getPublicUrl(path)`). Provide preview using `URL.createObjectURL` client-side while awaiting upload.

## Testing & docs

- Root test setup uses Vitest (`package.json` scripts) with tests collocated under `reserve/tests` and `tests`. We'll need to add new suites for:
  - API handler unit/integration tests (can mock Supabase client with `vi.mock`).
  - React component tests with Testing Library (see existing tests in `reserve/tests/unit`).
- Playwright config exists (`playwright.config.ts`) but no profile-specific spec yet.
- Documentation pattern: Markdown files in `docs/` such as `docs/architecture/...`. New feature doc can live at `docs/profile-management.md` describing API contract, route behaviour, validation rules, and testing commands.

## User clarifications

- Profile form should **not** surface `price_id` ("not stripe will be required"). Treat as backend-only.
- Email must remain unchanged (client and server should ignore attempts to mutate).
- Avatar needs **upload support with previews**; simple URL text field is insufficient.

## Edge cases / open questions

- Database currently allows `email` mutations; decide whether API enforces immutability by rejecting payloads containing different email or simply omitting it.
- Need strategy when `profiles` row missing: insert default row on first GET/PUT to avoid 404 per RLS pattern.
- Decide cache busting for image updates (e.g., append query param) to avoid stale avatars in UI.

## Verification notes

- Cross-checked schema definitions across `database.sql`, `current.sql`, and `types/supabase.ts` to ensure there’s no drift.
- Confirmed `react-hot-toast` + React Query already configured via `AppProviders`.
- Double-checked there’s no existing storage helper to avoid duplicating functionality.
