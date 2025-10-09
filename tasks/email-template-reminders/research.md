# Reservation Email Enhancements — Research

- Booking emails are the only templates currently implemented (`server/emails/bookings.ts`), so improving this file establishes the system-wide style. Future templates should conform to the same pattern for consistency.

## Current Email Pipeline

- Emails are dispatched through `libs/resend.ts`. This wrapper now supports attachments, sender aliases, and structured logging. Every template should rely on this helper so we maintain a single implementation surface.
- `server/emails/bookings.ts` orchestrates confirmation, update, and cancellation messages. `renderHtml` and `renderText` produce the HTML/plain versions, while `dispatchEmail` handles status-dependent content.

## UX + Design Audit

- Existing markup already includes two-column sections, status badge, and CTA button but the structure uses nested tables with inconsistent spacing, duplicated inline styles, and limited typographic hierarchy.
- Mobile responsiveness relies on a single `@media (max-width: 600px)` block but lacks class-level overrides for buttons and columns, causing cramped layouts on small screens.
- Action buttons (calendar/wallet) were recently added yet their styling differs from the primary CTA and does not communicate affordances consistently.
- There is no preheader, font stack definition, or semantic wrapping element for the email article, which can reduce deliverability preview quality and screen‑reader clarity.

## Calendar & Wallet Functionality

- `lib/reservations/calendar-event.ts` (shared) builds ICS payloads; attachments are already supported in `dispatchEmail` for confirmation/update emails.
- Wallet deep links resolve to the manage page with a query flag (`action=wallet`). On the frontend, the reservation client now reads that flag to focus the correct controls.

## Design Goals for Refresh

1. Establish a single design language: consistent typography, spacing scale, color palette, and border radii.
2. Improve mobile readability with stacked sections, wider tap targets (≥44 px), and clear button grouping.
3. Increase accessibility: semantic markup (`role="article"`, headings order, descriptive alt text), focusable action cues, and high-contrast color pairings.
4. Reduce inline style duplication by introducing clear utility classes (via templated strings) and small helper functions to render buttons/sections.
5. Insert preheader copy to improve inbox previews and maintain brand voice.

## Performance & Compatibility Considerations

- Stick to table-based layout for broad client support, but minimise nested tables and set `width="100%"` plus explicit `max-width` wrappers for predictable scaling.
- Use gradients/images sparingly—prefer flat colors to keep payload size small and avoid blocked external assets.
- Ensure CTA buttons rely on `<a>` elements styled with inline attributes so clients without CSS still expose actionable links.

## Outstanding Questions

- Should cancellations also include secondary actions (e.g. rebook)? Currently specification keeps them minimal; maintain this behaviour unless new requirements emerge.
- If future templates require logos/images, we will need an asset hosting strategy; for now stay text-first.
