# Implementation Checklist

## Setup

- [x] Review research and finalize implementation plan
- [ ] Align stakeholders on scope and assumptions (include filter/detail redesign sign-off)

## Core Functionality

- [x] Extend `getTodayBookingsSummary` with contact/reference/detail fields
- [x] Wire summary into `/ops` server page with auth gating
- [x] Ensure TodayBookingsCard consumes enriched data
- [x] Add ops booking status endpoint for show / no-show toggles

## UI/UX

- [x] Add calendar-based date selector for viewing other service days
- [x] Overlay heatmap intensity cues on calendar days based on covers
- [x] Add filter controls for All / Upcoming / Show / No show
- [x] Render responsive desktop table + mobile cards with expanded booking fields
- [x] Implement booking detail dialog (notes, contacts, metadata)
- [ ] Validate mobile-first layout and responsiveness
- [ ] Confirm focus styles and accessibility affordances
- [x] Handle empty states and error messaging (including filter-empty)
- [x] Flag past-start bookings with attention messaging

## Testing

- [x] Update unit tests for new summary fields/logic
- [x] Run lint and targeted test suites
- [ ] Perform manual QA with seeded data

## Documentation

- [ ] Update verification report with findings (commands, manual QA, open issues)
- [ ] Note follow-up work or iterations

## Questions/Blockers

- Are additional metrics (e.g., revenue) expected in MVP?
- Do we need to support restaurant switching before shipping MVP?
- Should filter selection persist (URL, storage)?
