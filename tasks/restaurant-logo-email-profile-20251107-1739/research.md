# Research: Restaurant logo uploads for email branding

## Requirements

- Functional:
  - Allow authenticated restaurant owners/admins to upload a branding image (logo) from the Ops → Restaurant Settings page.
  - Persist the resulting public URL with the restaurant profile so transactional emails (e.g., booking confirmations) can show the logo to recipients.
  - Provide a way to clear/revert the logo if an operator removes it.
- Non-functional (a11y, perf, security, etc.):
  - File uploads must enforce type/size constraints similar to the profile avatar flow (≤2 MB, JPEG/PNG/WEBP/SVG) and give accessible error feedback.
  - Only authorized members of the restaurant (owner/admin) may upload or delete branding assets.
  - Email markup must degrade gracefully when no image exists (fallback text) and stay within existing responsive template budgets.
  - New storage bucket + DB column changes must go through Supabase (remote) and integrate with existing query/mutation hooks.

## Existing Patterns & Reuse

- `components/profile/ProfileManageForm.tsx` + `hooks/useProfile.ts` show an end-to-end avatar upload workflow (preview, validation, optimistic UI, POST `/api/profile/image`). Mirrors the UX we need for logos.
- `src/app/api/profile/image/route.ts` already solves Supabase storage uploads with validation + bucket bootstrap. We can borrow the same constants/guards for a restaurant-specific endpoint.
- Restaurant settings UI resides in `components/features/restaurant-settings/RestaurantProfileSection.tsx` which renders `components/ops/restaurants/RestaurantDetailsForm.tsx`. The form exposes a `children` slot, so we can embed a logo uploader without rebuilding the form.
- Booking emails use `server/emails/bookings.ts` which renders the responsive template via `renderEmailBase`. Injecting a header block there will place the logo atop every booking email automatically. Venue metadata is already fetched through `resolveVenueDetails` (`server/emails/bookings.ts` + `lib/venue.ts`).

## External Resources

- n/a (existing repo patterns suffice for uploads + email rendering).

## Constraints & Risks

- Requires adding a new `logo_url` column to `public.restaurants` plus regenerated Supabase types and Service-layer DTOs; must not break other code paths reading restaurants.
- Need a dedicated storage bucket (e.g., `restaurant-branding`) with public access; bucket bootstrap must be idempotent for first-use scenarios.
- Email clients are strict about mixed content; ensure uploaded URLs are HTTPS (Supabase public URLs already are) and images include width/height attributes to avoid layout jank.
- We must avoid forcing operators to click “Save” after uploading—either auto-save via PATCH or clearly communicate state; plan is to POST upload then immediately PATCH via the existing mutation so the logo can be used right away.
- Manual Chrome DevTools QA will be needed later for the new UI (per AGENTS instructions).

## Open Questions (owner, due)

- Will future emails beyond booking confirmations also need the logo? (Assumption: yes, but the header injection via `renderEmailBase` covers all booking transactional emails for now.)
- Should we support alternative aspect ratios? (Assumption: we simply constrain UI to square preview with guidance; email markup can limit max width.)

## Recommended Direction (with rationale)

1. Extend the Supabase schema (`logo_url` on `restaurants`) + generated types, and thread the field through service DTOs/hook responses so Ops UI + emails can consume it. Rationale: keeps branding metadata co-located with restaurants.
2. Add `/api/ops/restaurants/[id]/logo` modeled after the profile avatar route to upload validated files into a new public bucket (`restaurant-branding`) scoped per restaurant. Rationale: reuse proven upload flow and enforce RBAC server-side.
3. Build a client-side `RestaurantLogoUploader` inside `RestaurantProfileSection` that previews the current logo, handles upload/remove states, and PATCHes `logoUrl` via `useOpsUpdateRestaurantDetails`. Rationale: leverages existing mutation + toast patterns without rewriting the form.
4. Update `server/emails/bookings.ts` (and shared `VenueDetails` helpers) to fetch the logo URL and emit a header block (image or fallback text) inside `renderEmailBase`. Rationale: ensures every booking email automatically shows the uploaded logo to recipients.
