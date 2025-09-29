# Research – Observability & QA Enhancements

## Repository signals (analytics)

- `lib/analytics/emit.ts` already exports a `emit(eventName, payload)` helper used across dashboard (hooks & dialogs). It streams JSON with `{ name, ts, props }`, logs to console if non-prod, and prefers `navigator.sendBeacon` before falling back to `fetch` with `keepalive`. No batching, schema validation, or user/context metadata today.
- `/api/events/route.ts` accepts POST, tries to JSON.parse, logs in non-prod, and returns `202`. No persistence yet; schema enforcement is caller-side.
- Existing dashboard flows instrumented events include: `booking_edit_opened`, `booking_edit_submitted`, `booking_edit_succeeded`, `booking_edit_failed`, `booking_cancel_confirmed`, `booking_cancel_succeeded`, `booking_cancel_failed`, `dashboard_empty_state_viewed`.
- `lib/analytics.ts` contains historical Plausible tracking with sanitisation. Dashboard currently imports `emit` directly; there is no central event registry.

## Session & identity surface area

- Browser code uses `getSupabaseBrowserClient()` (singleton) to interact with Supabase auth. Components like `Header` and `LayoutClient` pull session state via `supabase.auth.getSession()` and store in local state.
- API handlers rely on `getRouteHandlerSupabaseClient`. Session data includes `session.user.email` and `session.user.id` (Supabase UUID). No helper currently exposes hashed email / anon id.
- Database schema already has `customers.auth_user_id uuid REFERENCES auth.users(id)` and indexes on `(restaurant_id, auth_user_id)` plus global `customers_auth_user_idx`. `bookings` table also contains `auth_user_id`. Story E3 proposes adding `customers.supabase_user_id` despite existing `auth_user_id`, so we need to reconcile (either reuse existing column or introduce alias + migration + types update). Need to confirm with stakeholder whether duplication is intentional.

## Dashboard UI accessibility snapshot

- Dialog primitives (`components/ui/dialog.tsx`) wrap Radix Dialog: overlay + content with focus trap, escape-to-close, `DialogTitle`/`Description` semantics out of the box.
- `EditBookingDialog` & `CancelBookingDialog` both mount `<Dialog open={...}>` with `DialogContent`. `EditBookingDialog` blocks `onInteractOutside` (prevent accidental close) but keeps escape key behaviour. They provide `DialogTitle` and `DialogDescription`, but do not set labelled-by explicitly. Buttons have text labels; spinner text uses ellipsis glyph (`…`). Need to ensure pending buttons maintain label per spec.
- Table markup (`components/dashboard/BookingsTable.tsx`) already uses `<th scope="col">` headers, `<tbody>` rows, and accessible button groups. Buttons use textual labels (“Edit”, “Cancel”). Need to audit additional tables/components for consistent semantics.
- No `components/a11y` folder yet. If focus trapping helpers required (for complex flows), they are absent currently.

## Testing landscape

- Vitest configured at `reserve/vitest.config.ts` (not yet inspected, assume standard). Unit tests live under `reserve/tests/unit`. Existing coverage includes `EditBookingDialog`, `CancelBookingDialog`, API route tests, etc. Tests mock `@/lib/analytics/emit` as needed.
- Playwright config (`playwright.config.ts`) points to `reserve/tests/e2e`. Current specs: `wizard.plan.spec.ts` (gated by `baseURL`) and a skipped `reserve.smoke.spec.ts`. Need to add `dashboard.spec.ts` with flows described in Story F2. Infrastructure for fixtures/seeding not yet fleshed out; seeds exist at `database/seed.sql` but automation hooking missing.

## Database & RLS groundwork

- Schema file `database/database.sql` is comprehensive/hardening. `customers` table includes normalized email/phone, marketing flags, `auth_user_id` linking to Supabase `auth.users`. Index on `(restaurant_id, auth_user_id)` ensures fast lookup if `auth_user_id` present.
- There is currently no `supabase_user_id` column; story E3’s migration would add a nullable column + index. Before implementing we must decide whether to alias existing `auth_user_id` or keep both (possible duplication). Need to review `current.sql` & `database/migrations/index.sql` to ensure consistency when adding columns.
- No RLS policies for bookings yet; new policies must join through `customers.supabase_user_id` (or `auth_user_id`) to allow SELECT/UPDATE for owning user.

## External constraints & open questions

- Stories confirm `/api/events` endpoint already exists; need to augment emitter & schema without breaking existing caller expectations.
- Accessibility audit requested for "full dashboard"; we must inspect other interactive components beyond dialogs (pagination, filters, toasts) and ensure focus management + aria attributes align with requirements list (focus-visible, trap, labelled controls, etc.).
- Playwright presence uncertain (“Not sure”) implies we must verify if dependencies/CI already support it or whether bootstrapping (fixtures, env vars) is necessary.
- Dependency policy unspecified (“Not sure”), so prefer zero/minimal new dependencies; justify any additions (e.g., `superjson`, crypto polyfills) explicitly.

## Verification notes

- Double-checked analytics usage using `rg "emit("` to ensure complete event inventory.
- Cross-validated Supabase identity fields across `database.sql`, `types/supabase.ts`, and `server/bookings.ts` to confirm `auth_user_id` is persisted end-to-end.
- Confirmed Playwright availability by inspecting `package.json` scripts and `playwright.config.ts`.
- Confirmed Radix dialog semantics by reviewing `components/ui/dialog.tsx` implementation (Radix provides focus trap + escape handling by default), but still need to test for regressions after modifications.

## Uncertainties / Risks to clarify

- Whether to replace `auth_user_id` with `supabase_user_id` or add a new column (possible duplication). Need stakeholder direction before migration.
- Source for analytics context fields (`user.anonId`, `user.emailHash`, `context.route`, `context.version`). `version` likely from build metadata (check for existing version constant? none found yet). Need plan for deriving anonId/hash without storing PII client-side.
- Extent of dashboard audit (which pages/components exist beyond bookings table). Need to map routes (likely under `app/(dashboard)` or similar) to ensure coverage.
- Seed/backfill strategy for Story E3: confirm if we can access Supabase `auth.users` from service role within migration/backfill script.
