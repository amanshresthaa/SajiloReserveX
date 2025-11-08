# Implementation Plan: Restaurant logo uploads for email branding

## Objective

Enable restaurant operators to add or update a branded logo from Ops → Restaurant Settings so that transactional booking emails automatically display that logo in their header, reinforcing brand recognition for guests.

## Success Criteria

- [ ] Restaurant settings UI shows the current logo (or placeholder) with controls to upload, replace, or remove it, including validation + toasts.
- [ ] Upload endpoint enforces auth, file type (< 2 MB JPEG/PNG/WEBP/SVG), stores assets in Supabase storage, and returns a cache-busted public URL.
- [ ] PATCHing restaurant details accepts `logoUrl` and persists it in the `restaurants` table.
- [ ] Booking emails (confirmation/update/cancel) render the logo (or fallback text) above the main email card using the stored URL.

## Architecture & Components

- **DB/Migrations**: Add nullable `logo_url text` to `public.restaurants`. Update `types/supabase.ts` + DTOs in `server/restaurants/*`, `src/services/ops/restaurants.ts`, and Zod schemas.
- **API Upload Route**: `src/app/api/ops/restaurants/[id]/logo/route.ts` (Node runtime) modeled after profile avatar route. Validates session, ensures `owner/admin` membership, verifies bucket (`restaurant-branding`), uploads file, returns `{ path, url, cacheKey }`.
- **Client Hooks**:
  - Extend `useOpsRestaurantDetails` types and `useOpsUpdateRestaurantDetails` payload to include `logoUrl`.
  - New `useOpsUploadRestaurantLogo(restaurantId)` returning a mutation that POSTs FormData to the new endpoint.
- **UI**: `RestaurantProfileSection` imports a new `RestaurantLogoUploader` component rendered above the existing form. Component responsibilities:
  - Show current logo preview with fallback initials (accessible alt text).
  - Provide file input + button, enforce validations before calling upload mutation.
  - On success, call `useOpsUpdateRestaurantDetails` with `logoUrl` (or `null` when removing) and surface toasts.
  - Manage focus + aria-live feedback for errors per a11y requirements.
- **Emails**: Extend `resolveVenueDetails` + `VenueDetails` to carry `logoUrl`. Pass header HTML to `renderEmailBase` within `renderHtmlRevamp`, inserting `<img>` (bounded width, alt text) if present, else fallback text badge.

## Data Flow & API Contracts

- **Upload**: `POST /api/ops/restaurants/:id/logo`
  - Request: multipart/form-data with `file: File`
  - Response: `{ path: string; url: string; cacheKey: string }`
  - Errors: 401 unauthenticated, 403 unauthorized, 400 validation (file missing/too big/unsupported), 500 upload failure.
- **Patch**: existing `PATCH /api/ops/restaurants/:id` now accepts `{ logoUrl?: string | null }`.
- **Email fetch**: `resolveVenueDetails` selects `logo_url` along with other columns.

## UI/UX States

- Loading: skeleton already exists; logo uploader adds its own shimmer/spinner while upload pending.
- Empty state: show neutral avatar circle with “Add logo” button + helper copy.
- Success: preview swaps to new image, toast confirms, button label becomes “Replace logo”.
- Error: inline message with aria-live polite/ assertive, guidance to retry.

## Edge Cases

- Upload triggered while another mutation pending → disable controls until resolved to avoid double uploads.
- Removing logo should immediately show placeholder and persist `null`.
- If bucket creation fails, surface descriptive error + log server-side.
- Email rendering should not break when URL invalid or image blocked; fallback text ensures brand still visible.

## Testing Strategy

- Unit-ish: rely on TypeScript for schema coverage; add focused tests if necessary (e.g., server upload validator?). Given time, manual verification + lint/tsc.
- Manual QA (Phase 4): use Chrome DevTools MCP to upload, replace, remove logos, and inspect email preview route (if available) or log to verify header HTML. Validate a11y (focus, aria-live) + network (POST/PATCH payloads) and ensure no console errors.
- Regression: run lint + targeted tests if applicable (e.g., any Jest/Vitest touching `VenueDetails`?).

## Rollout

- No feature flag; change is scoped to Ops settings + email rendering.
- Monitor booking email logs / Resend dashboard for template errors after deploy.
- Provide removal path so ops can revert if issues arise.
