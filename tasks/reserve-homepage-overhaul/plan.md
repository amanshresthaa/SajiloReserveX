# Plan: Move Reserve Flow to Homepage with New Navbar

## Goals

- Replace the marketing landing page at `/` with the current `/reserve` reservation picker, keeping dynamic Supabase data and error handling.
- Introduce a new, fully accessible customer-facing navbar (desktop + mobile) with clear hierarchy and skip link support.
- Preserve legacy `/reserve` URL by redirecting it to `/` to avoid dead links.

## Steps

1. **Design navbar component**
   - Build `components/marketing/Navbar.tsx` using shadcn primitives (`Button`, `Dialog`) for accessible focus-trapped mobile menu.
   - Include a persistent “Skip to content” link, logo/home link, primary nav items (e.g., Restaurants, Support), and `ButtonSignin` CTA.
   - Ensure visible focus states, proper aria labels, and keyboard navigation per APG guidance.
2. **Rebuild homepage layout**
   - Update `app/page.tsx` to:
     - Export `dynamic = 'force-dynamic'` and reuse `listRestaurants()` logic from old `/reserve` page.
     - Render the new navbar + reservation hero text + restaurant grid/error/empty states.
     - Refresh metadata (title/description) for the reservation-focused homepage.
     - Ensure headings have `scroll-mt` and the main element uses `id="main-content"`.
   - Extract shared restaurant card UI into a local component if needed for clarity.
3. **Handle legacy `/reserve` route**
   - Replace existing implementation with a simple redirect to `/` (using `redirect()`), keeping metadata minimal to avoid duplicate content.
4. **Cleanup & verification**
   - Remove now-unused imports/components from updated files.
   - Run lint (and other quick checks if relevant) to ensure no type or formatting issues.
   - Manual sanity checklist: navbar keyboard flow, skip link target, restaurant grid rendering.
