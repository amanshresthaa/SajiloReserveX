---
task: booking-flow-frontend-consolidation
timestamp_utc: 2025-11-16T14:36:13Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking Flow Frontend Consolidation

## Objective

We will produce a consolidated JSON artifact of the booking flow frontend code (guest reservation experience) with file paths and contents for easy reference, and implement UX improvements identified (offline flow clarity, consent defaults, navigation, availability loading/affordances).

## Success Criteria

- [x] Curated list covers booking entry pages, reserve router/pages, reservation wizard runtime files, and shared booking configs referenced by the wizard.
- [x] JSON contains `path`, optional `category/description`, and `content` for each file; valid JSON saved to the task artifacts.
- [ ] Offline UX aligns with actual behavior (no false “queue” promise) and keeps non-submission controls usable.
- [ ] Contact/save/marketing defaults are opt-in with clear retention copy.
- [ ] Post-confirm navigation respects entry context (return path instead of hard-coded /thank-you).
- [ ] Availability load friction reduced (prefetch/copy improvement) without breaking existing data flow.
- [ ] Tests/stories are excluded unless explicitly requested; this is noted in the output notes.

## Architecture & Components

- Input directories (runtime only, excluding `__tests__`, `__stories__`, `*.test.*`, `*.stories.*`):
  - `src/app/(guest-public)/(guest-experience)/reserve`
  - `reserve/app`
  - `reserve/pages`
  - `reserve/features/reservations/wizard` (including `ui`, `hooks`, `model`, `services`, `context`, `di`, `utils`, `api`)
  - `reserve/shared/config/{booking,runtime,venue}.ts` (and related booking helpers if referenced)
- Output artifact: JSON file under `tasks/booking-flow-frontend-consolidation-20251116-1435/artifacts/booking-flow-frontend.json`.

## Data Flow & API Contracts

- Simple Node script/utility gathers file paths, reads contents as strings, and writes a structured JSON array; no remote calls.
- UX fixes: updates to wizard offline state handling, consent defaults/copy, navigation return path, availability affordance.

## UI/UX States

- N/A

## Edge Cases

- Large file set leading to heavy JSON size → keep scope to runtime booking files and filter by name.
- Non-UTF8 files (unlikely) → ensure reading as UTF-8; skip binary files if any.
- Accidental inclusion of secrets → verify content is only source code and config constants already in repo.
- Navigation regression risk if return path handling is wrong → keep `/thank-you` fallback and add explicit returnPath derivation.
- Offline affordance changes must avoid enabling submits without backend support → keep submits gated, clarify copy, leave non-submit controls enabled.

## Testing Strategy

- Run the script and validate JSON with `node -e "require('./...json')"` or `jq .` to ensure it parses.
- Spot-check a few critical entries (e.g., `BookingWizard.tsx`, `PlanStep.tsx`, `booking.ts`) for presence.
- Manual QA via Chrome DevTools for booking wizard after changes (offline/online toggle, consent toggles, navigation close path).

## Rollout

- Not applicable.

## DB Change Plan (if applicable)

- Not applicable.
