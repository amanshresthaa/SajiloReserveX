---
task: booking-flow-frontend-consolidation
timestamp_utc: 2025-11-16T14:36:13Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Booking Flow Frontend Consolidation

## Requirements

- Functional:
  - Produce a JSON artifact that consolidates the frontend code for the booking/reservation flow.
  - Include the key runtime files (components, hooks, context, configs) that drive the guest booking wizard and entry pages.
- Non-functional (a11y, perf, security, privacy, i18n):
  - No secrets or tokens in the JSON; paths and source only.
  - Keep the artifact readable and organized (structure, descriptions, UTF-8 ASCII).
  - Avoid unnecessary bloat (exclude non-runtime tests/stories unless requested).

## Existing Patterns & Reuse

- Booking flow lives in the `reserve` package using React Router: `reserve/app/router.tsx`, `reserve/app/routes.tsx`, and pages under `reserve/pages` (e.g., `WizardPage`, `RootLayout`).
- Guest entry is bridged from Next.js via `src/app/(guest-public)/(guest-experience)/reserve` with `ReserveApp` mounting `ReserveRouter`.
- Core flow is the reservation wizard under `reserve/features/reservations/wizard` (UI steps, hooks, context, services, models, DI, utils).
- Shared booking configs referenced from `reserve/shared/config` (e.g., `booking.ts`, `runtime.ts`, `venue.ts`).
- Prior art for JSON listings exists as `booking_issue_files.json` (description + file list format).

## External Resources

- None identified; scope is internal code consolidation.

## Constraints & Risks

- Scope ambiguity: whether to include tests/stories/mocks or only runtime code.
- JSON size could be large given the number of wizard files; need a clear inclusion filter to keep it manageable.
- Ensure we do not miss shared config/hooks that the wizard imports (e.g., `@shared/config/booking`).

## Open Questions (owner, due)

- Q: Should the JSON include only runtime booking wizard files or also tests/stories? (owner: @amankumarshrestha, due: before implementation)
- Q: Include shared booking config files outside the wizard (e.g., `reserve/shared/config/booking.ts`)? (owner: @amankumarshrestha, due: before implementation)
- Q: Desired output location? (Defaulting to task artifacts unless specified.) (owner: @amankumarshrestha, due: before implementation)

## Recommended Direction (with rationale)

- Treat “booking flow frontend” as the guest reservation experience: entry pages (`src/app/(guest-public)/(guest-experience)/reserve`), router shell (`reserve/app`), pages (`reserve/pages`), and the reservation wizard (`reserve/features/reservations/wizard`) plus the shared booking configs it depends on.
- Exclude tests and Storybook files by default to keep the JSON focused on runtime code (call out if needed).
- Generate a structured JSON with metadata per file: `path`, optional `role/description`, and `content` (string). Store it under the task’s `artifacts/` for traceability.
- Use a small script to gather files from the curated directories, filter out `__tests__`/`__stories__`/`.stories`/`.test` files, and write the consolidated JSON.
