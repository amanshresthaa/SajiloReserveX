# Research — Profile CRUD & Home Flow

## Current profile implementation

- `public.profiles` columns: `id`, `name`, `email`, `image`, `customer_id`, `price_id`, `has_access`, `created_at`, `updated_at` (no `phone`) — see `database/database.sql:565`.
- API handlers: `app/api/profile/route.ts` (GET/PUT) with shared helpers in `lib/profile/server.ts`; supports `name` and `image` updates, explicitly rejects email changes.
- Avatar uploads via `app/api/profile/image/route.ts`, storing images under Supabase Storage bucket `profile-avatars/<user>/<timestamp>-uuid.ext`.
- Client form `components/profile/ProfileManageForm.tsx` collects `name`, read-only `email`, avatar; relies on `hooks/useProfile.ts`. No phone field present.
- `types/supabase.ts` mirrors schema (no `phone`).

## Observed issues

- Runtime error in Next image: Supabase storage host `mqtchcaavsucsdjskptc.supabase.co` missing from `next.config.js` whitelist.
- Profile UX currently limited to name/avatar. Requirement adds editable phone (CRUD) while email stays read-only.
- Database must be patched to add `phone` column (likely nullable text with validation trigger/constraint); corresponding types and insert/upsert helpers must align.

## Routing & flows

- Protected routes: `/dashboard` gated via middleware; `/profile/manage` already included after recent change.
- Home page `app/page.tsx` still ShipFast boilerplate CTA; lacks links guiding to `/reserve`, `/dashboard`, `/profile/manage`.
- Dashboard page exists (`app/(authed)/dashboard/page.tsx`) with bookings table; route accessible via nav only after login; no direct CTA from home.

## Tasks surfaced

1. Allow storing/updating `phone` in profiles: requires DB schema patch, Supabase types regen/update, API validation updates, form field + accessibility, tests.
2. Add Supabase storage host to Next image config.
3. Improve home page flow: provide clear hero content describing Reserve app, surface CTAs to `/reserve` and signed-in experiences, consider conditional render based on auth session (may require server component or client hook) or provide static path with guidance. Ensure consistent navigation between `/`, `/dashboard`, `/reserve`, `/profile/manage`.
4. Ensure profile manage route handles phone CRUD end-to-end: GET returns phone (default null), PUT accepts trimmed phone with validation, UI field with inline errors, tests updated.

## Open questions / assumptions

- Phone format constraints? Lacking spec; assume E.164-ish? We can enforce length (e.g., 7–20 digits) similar to bookings contact info (`app/api/bookings/route.ts` uses `contactQuerySchema`).
- Need to update default profile seeding `resolveDefaultProfileInsert` to map user metadata (e.g., `phone_number`?). If absent, keep null.
- Should phone appear on `/profile` mobile stub? Likely yes for consistency.
- Home page improvement should remain accessible, with hero, benefits, and navigation prompts.

## Verification sources

- `database/database.sql`, `current.sql`
- `types/supabase.ts`
- `app/api/profile/route.ts`, `lib/profile/schema.ts`, `components/profile/ProfileManageForm.tsx`
- `next.config.js`
- `app/page.tsx`, `app/(authed)/dashboard/page.tsx`, `app/(authed)/profile/manage/page.tsx`
