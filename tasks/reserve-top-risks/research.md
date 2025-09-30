# Research – reserve top risks

## Cross-app runtime coupling

- The wizard hook pulls analytics and venue helpers from the Next.js app via `@/lib/*` aliases, e.g. `track` and `DEFAULT_RESTAURANT_ID` (`reserve/features/reservations/wizard/hooks/useReservationWizard.ts:6-7`).
- Those shared modules rely on `process.env`, which Vite does not polyfill by default (`lib/analytics.ts:1`, `lib/venue.ts:11-12`).
- Additional `process.env` reads show up inside wizard UI helpers (`reserve/features/reservations/wizard/hooks/useReservationWizard.ts:77-78`, `reserve/features/reservations/wizard/ui/wizardIcons.ts:41-44`), so the SPA bundle still expects Node globals when running in the browser.

## Environment configuration drift

- SPA env loader `reserve/shared/config/env.ts` reads only `process.env.NEXT_PUBLIC_*` keys at runtime and immediately parses them with Zod (`reserve/shared/config/env.ts:9-15`). No guard for missing vars in Vite (`import.meta.env`).
- Vite’s build targets still point at `.reserve-dist`, but there is no explicit `define` block to inject `process.env` shims (`reserve/vite.config.ts:5-26`).

## Wizard state sprawl

- Single `useReservationWizard` hook owns domain data, async mutation orchestration, local-storage side effects, sticky footer UI coordination, haptics, analytics, and navigation (`reserve/features/reservations/wizard/hooks/useReservationWizard.ts:20-210`).
- Reducer state couples booking data with UI affordances (`reserve/features/reservations/wizard/model/reducer.ts:49-120`) and reuses the same action set for confirmation, editing, and reset flows, making it harder to extend with new steps or alternate flows.
