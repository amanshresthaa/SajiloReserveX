# Implementation Checklist

## Backend & Schema

- [x] Add `logo_url` column via Supabase migration and update schema/types/service DTOs.
- [x] Extend REST + Zod schemas so Ops + Owner APIs accept and return `logoUrl`.
- [x] Update restaurant server helpers/tests to include the new branding field.

## Upload Flow

- [x] Add `/api/ops/restaurants/[id]/logo` endpoint with RBAC, validation, and Supabase Storage upload.
- [x] Create `useOpsRestaurantLogoUpload` hook for client-side mutations.

## UI/UX

- [x] Build `RestaurantLogoUploader` with preview, validation, and remove controls.
- [x] Embed uploader into Ops Restaurant Settings alongside existing profile form.

## Emails & Rendering

- [x] Thread `logoUrl` through venue helpers + booking email template header.
- [x] Update preview script and shared venue config defaults.

## Verification

- [x] Run `pnpm lint`.
