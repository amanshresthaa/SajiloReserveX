# Plan — Profile CRUD & Home Flow Enhancements

1. **Database & Types Alignment**
   - Add `phone` column to `public.profiles` (nullable text with reasonable constraint, e.g., 7–20 chars) in `database/database.sql` (+ optional migration snippet).
   - Update `types/supabase.ts` (Row/Insert/Update) and helpers in `lib/profile/server.ts` to include `phone`.
   - Adjust default profile seeding to capture phone metadata if present.

2. **API & Validation Updates**
   - Extend `profileUpdateSchema` to accept optional `phone` (trimmed, validated).
   - Modify `app/api/profile/route.ts` to return `phone` in responses and persist updates (while email stays immutable).
   - Ensure avatar upload flow unchanged; add tests covering phone CRUD scenarios.

3. **Client Form & UX**
   - Update `ProfileManageForm` to surface phone input (with accessible labeling, inline validation) and send trimmed payload.
   - Display read-only email, editable name/phone, avatar upload with remote image host whitelisted.
   - Ensure mobile `/profile` stub reflects phone and edit CTA.

4. **Next.js Image Configuration**
   - Add Supabase storage domain(s) to `next.config.js` images whitelist.

5. **Home / Navigation Flow**
   - Redesign `app/page.tsx` hero to highlight booking platform value, include CTAs to `/reserve`, `/dashboard`, `/profile/manage` (login dependent). Consider server component or shared nav for auth CTA vs. guest.
   - Add prominent link(s) within dashboard/reserve to profile manage as needed for flow consistency (audit existing nav, adjust if missing).

6. **Tests & Verification**
   - Update unit tests: `reserve/tests/profile/api.test.ts`, `tests/profile/ProfileManageForm.test.tsx`, schema tests to cover phone.
   - Add e2e coverage if necessary (at least ensure existing Playwright spec doesn’t break; optionally extend to phone). Document manual verification: seed run `pnpm lint`, `pnpm test`, note `pnpm typecheck` known baseline failures.

7. **Docs & Changelog**
   - Update `docs/profile-management.md` describing phone CRUD and new flow instructions.

Sequencing: DB/types → API/schema → Client UI → Next config → Home/dashboard flow → Tests/docs → Verification.
