---
task: revamp-booking-dialog-layout
timestamp_utc: 2025-11-19T09:30:00Z
owner: github:@amanshresthaa
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Revamp Booking Details Dialog Layout

## Phase 1: Structural Changes

1.  **Widen Dialog**: Update `DialogContent` to `max-w-5xl`.
2.  **Create Grid**: Implement a responsive grid (`grid-cols-1 lg:grid-cols-12`) inside the content.
    - Left Col: `lg:col-span-4` (Guest Context).
    - Right Col: `lg:col-span-8` (Operations).

## Phase 2: Left Sidebar (Guest Context)

1.  **Move Components**: Extract Guest Profile, Contact Info, and Notes from `Overview` tab.
2.  **Design Sidebar**:
    - Add `Avatar` (Initials) for visual anchor.
    - Stack `ProfileCard` items vertically.
    - Style `DetailCard` items (Email/Phone) to be more compact list items.
    - Add "VIP" styling prominently.

## Phase 3: Right Content (Operations)

1.  **Refactor Header**:
    - Move Customer Name to Sidebar (or keep in header if space allows, but Sidebar is better for "Profile").
    - Keep Date/Time, Status, Countdown in the Right Column Header.
2.  **Update Tabs**:
    - **Overview**: Focus on "Quick Actions" and "Booking Specifics" (Party Size, etc).
    - **Tables**: Ensure `TableFloorPlan` fits and looks good.

## Phase 4: Visual Polish

1.  **Borders/Separators**: Add a vertical divider between columns.
2.  **Backgrounds**: Give the Sidebar a subtle background (`bg-muted/10`) to distinguish it.
3.  **Typography**: Refine headings and labels.

## Verification

- Check responsiveness (Mobile vs Desktop).
- Verify Floor Plan interactivity in new width.
- Verify all data points (Allergies, Notes) are visible.
