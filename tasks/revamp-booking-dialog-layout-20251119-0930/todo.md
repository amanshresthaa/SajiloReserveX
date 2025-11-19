---
task: revamp-booking-dialog-layout
timestamp_utc: 2025-11-19T09:30:00Z
owner: github:@amanshresthaa
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist: Revamp Booking Details Dialog Layout

## Phase 1: Structural Changes

- [x] Update `DialogContent` width to `max-w-5xl`
- [x] Implement 2-column grid layout (`lg:grid-cols-12`)
- [x] Add vertical divider and background styling

## Phase 2: Left Sidebar (Guest Context)

- [x] Move Guest Profile logic to sidebar
- [x] Move Contact Info to sidebar
- [x] Move Notes to sidebar
- [x] Implement `Avatar` for customer initials
- [x] Style compact `DetailCard` for sidebar

## Phase 3: Right Content (Operations)

- [x] Refactor Header (Status, Date/Time, Actions)
- [x] Update `Overview` tab content (Quick Actions, Booking Details)
- [x] Update `Tables` tab content (Floor Plan)

## Phase 4: Visual Polish & Verification

- [x] Verify responsiveness
- [x] Verify Floor Plan interactivity
- [x] Ensure all data points are visible
