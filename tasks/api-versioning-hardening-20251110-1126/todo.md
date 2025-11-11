# Implementation Checklist

- [x] Create task folder & SDLC docs
- [x] Update reserve env fallback + warning to `/api/v1`
- [x] Update `lib/env.ts` reserve fallback
- [x] Switch guest runtime modules (`lib/analytics/emit.ts`, `lib/restaurants/api.ts`, `hooks/useProfile.ts`, `src/app/(guest-public)/thank-you/page.tsx`) to `/api/v1`
- [x] Update affected tests (e.g., `reserve/tests/profile/useUpdateProfile.test.tsx`)
- [x] `pnpm lint`
- [ ] Record verification
