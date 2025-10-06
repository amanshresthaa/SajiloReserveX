# Plan: Session-aware nav & CTA cleanup

## Objectives

- Make top-level CTAs and nav links react to Supabase auth state so returning diners see dashboard/profile shortcuts while guests see sign-in prompts.
- Consolidate CTA styling around shadcn `buttonVariants` instead of DaisyUI `btn` classes.
- Ensure authenticated layouts link to the updated booking entry point (`/`).

## Steps

1. **Add shared session hook + CTA helper**
   - Create `useSupabaseSession` hook (client) that returns `{ user, status }` using the browser Supabase client with onAuthStateChange subscription.
   - Build `MarketingSessionActions` component that renders the primary/secondary CTA pair (configurable size/layout) based on session.
2. **Update marketing nav & hero**
   - Refactor `components/marketing/Navbar.tsx` to use `useSupabaseSession` for nav items and swap CTAs with `MarketingSessionActions` (size `sm`).
   - Replace hard-coded hero CTA block in `app/page.tsx` with `MarketingSessionActions` (size `lg`, stacked on mobile) to keep behavior in sync.
3. **Refresh blog header CTA**
   - Swap `ButtonSignin` usage in `app/blog/_assets/components/HeaderBlog.tsx` with the new session-aware CTA (single-button variant) so styling matches the rest of marketing.
   - Remove or adapt `ButtonSignin.tsx` if no longer needed (consider exporting a thin wrapper to avoid dead code).
4. **Align authenticated layouts**
   - Update `/dashboard` and `/profile/manage` layouts to point “New booking” buttons at `/` and tweak copy if needed.
5. **Cleanup & verification**
   - Drop unused DaisyUI CTA helpers if obsolete or note for follow-up.
   - Run `pnpm lint`; perform smoke check for nav/hero/blog header interactions (desktop + mobile menu toggle).
