---
task: revamp-booking-dialog-layout
timestamp_utc: 2025-11-19T09:30:00Z
owner: github:@amanshresthaa
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Research: Revamp Booking Details Dialog Layout

## Objective

Transform the `BookingDetailsDialog` from a narrow, vertical-scroll-heavy modal into a modern, wide, 2-column "Master-Detail" interface. This improves UX by keeping Guest Context (preferences, allergies, notes) visible while performing operations (table assignment, check-in).

## Current State Analysis

- **Width**: `max-w-2xl` (Narrow).
- **Layout**: Single column, stacked.
- **UX Issue**: Context switching. When assigning tables in the `Tables` tab, user cannot see Guest Profile (allergies, seating prefs) which are buried in the `Overview` tab.
- **Visuals**: Standard modal look.

## Proposed Design: "The Command Center"

- **Width**: `max-w-5xl` (Wide).
- **Layout**: 2-Column Grid (30% Left / 70% Right).

### Left Column: Guest Context (Persistent)

- **Header**: Large Avatar/Initials, Customer Name, Loyalty Tier.
- **Contact**: Email, Phone (List style with copy actions).
- **Tags**: Allergies, Dietary, Seating Preference (Critical info).
- **Notes**: Booking & Profile notes.
- **History**: Summary stats (if available) or link.

### Right Column: Operation Context (Tabs)

- **Header**: Booking Status (Badge), Date/Time, Countdown, Actions Menu.
- **Tabs**:
  1.  **Overview**: Quick Actions (Check-in/out), Timeline/History summary.
  2.  **Tables**: Floor plan and assignment controls.
  3.  **Payments**: (Future placeholder).

## Component Strategy

- **Reuse**: `DetailCard`, `ProfileCard` (might need styling tweaks for sidebar).
- **New**: `GuestSidebar` component (internal to dialog) to organize the left column.
- **Responsive**: On mobile, stack the columns (Left becomes Top or separate tab).

## Risks

- **Floor Plan Width**: Ensure `TableFloorPlan` still fits comfortably in the right column (approx 650-700px). Since original dialog was `max-w-2xl` (672px), this should be fine.
- **Height**: Ensure the modal fits on standard laptop screens (`max-h-[85vh]`).

## Success Criteria

- Guest allergies/notes are visible while assigning tables.
- No horizontal scrolling.
- "Premium" feel with better information density.
