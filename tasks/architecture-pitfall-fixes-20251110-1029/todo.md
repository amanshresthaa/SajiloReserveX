# Implementation Checklist

## Setup

- [x] Create task folder & SDLC stubs
- [x] Add shared CSRF helper with cookie/header constants

## Middleware Enforcement

- [x] Update `middleware.ts` to mint cookie, validate unsafe `/api` calls, and attach token to responses/redirects

## Client Updates

- [x] Teach `lib/http/fetchJson.ts` to attach `X-CSRF-Token`
- [x] Update `reserve/shared/api/client.ts` for the same
- [x] Patch bespoke fetches (`InviteAcceptanceClient`, `OpsRejectionDashboard`) to send header

## Verification

- [x] Run `pnpm lint`
- [ ] Update `verification.md` with results / rationale
