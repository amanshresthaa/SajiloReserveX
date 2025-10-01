# Sprint S8 — Error Handling Standardization: Research

## Current pain points

- Wizard hooks/components rely on `console.error` for failure cases:
  - `useReservationWizard` sets error state but logs via console when sticky actions change (`console.log`) and in other modules.
  - `useRememberedContacts` wraps localStorage calls in try/catch with `console.error`.
  - `useConfirmationStep` catches share API failures and logs to console.
- Server route `app/reserve/[reservationId]/page.tsx` prints Supabase/auth errors with `console.error` before calling `notFound()`.
- No shared helper for mapping unknown errors to user-facing strings; each catch block constructs messages ad-hoc.
- No centralized reporter interface; future observability integrations would require touching every log site.

## Requirements recap (from sprint plan)

- Introduce an error reporter (`errorReporter.capture`) and `mapErrorToMessage` helper.
- Replace direct `console.*` usage in “hot paths” (wizard submission/page route) to go through the reporter and consistent mapping.
- Ensure reporter is injectable (align with new DI provider from S7) to allow no-op reporters during tests.

## Observations & considerations

- DI context already provides analytics/haptics/navigator; we can extend it with `errorReporter` to keep consumer changes minimal.
- Some console usage is dev-only (`console.log` under `runtime.isDev`)—we should evaluate whether to keep gated logs or route through reporter with debug flag.
- `useRememberedContacts` and `useConfirmationStep` may not be considered “hot paths” but contribute to noisy logging; decision needed whether to include them now.
- Server page cannot use client DI; default reporter should be usable directly in server modules.

## Open questions

1. Should `mapErrorToMessage` accept fallback strings + optional default (e.g., `'Unable to process booking'`)?
2. Do we emit analytics on errors as well, or only capture via reporter? (Assuming reporter handles future integration.)
3. How to thread reporter into async mutation flow to ensure errors bubble to single handling path.

## Baseline

- `pnpm test` / `pnpm lint` already green (ignoring known hook dependency warnings) before starting S8 work.
