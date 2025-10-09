# Reservation Email Enhancements — Plan

## Scope

Deliver a refreshed, consistent email design system (starting with the booking confirmation/update/cancellation template) that embraces modern layout principles, is mobile-friendly, and highlights calendar/wallet actions without sacrificing accessibility or performance.

## Decisions & Assumptions

- Reuse the existing Resend integration and attachment pipeline; confirmation/update messages will continue to ship an `.ics` file while exposing deep links (`?action=calendar|wallet`) for interactive flows.
- Adopt a unified typography & color scale (font stack: `Inter, SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; colors derived from the product palette).
- Use emoji glyphs for inline icons to avoid external assets. Touch targets must be at least 44 px high with generous spacing.
- Layout remains table-based for compatibility, but we’ll minimise nesting, employ clear class names, and add mobile overrides in a single media-query block.

## Plan

1. **Define visual tokens**
   - Gather palette, font stack, spacing scale, and border radii used across marketing/APP so the email mirrors brand styling.
   - Decide on section hierarchy (header, status ribbon, summary grid, actions, venue details, notes, footer).
2. **Refactor HTML template**
   - Rebuild `renderHtml` with semantic wrappers (`role="article"`, `aria-labelledby`).
   - Add preheader text, primary CTA, and a reusable helper to render secondary action buttons (calendar/wallet).
   - Improve responsiveness: stacked columns on ≤600 px, full-width buttons, adequate padding, and readable font sizes.
   - Ensure all colors meet contrast ratios (>4.5:1 for body text).
3. **Plain-text parity**
   - Update `renderText` to describe the same hierarchy (status, when/where, actions, attachments) so screen readers and search indexing remain informative.
   - Mention ICS attachment explicitly and provide direct URLs for calendar/wallet actions.
4. **Behavioural polish**
   - Confirm `dispatchEmail` still injects the correct copy per status, includes preheader text, and attaches the ICS only when available.
   - Keep cancellation slimmer (no calendar/wallet actions), but align typography/spacing for consistency.
5. **Verification**
   - Run targeted Vitest suites touching share helpers if altered.
   - `pnpm run build` to validate type safety and Next.js compilation.
   - (Optional) Use `pnpm test-email` (custom script) for manual preview.

## Risks / Follow-ups

- We still lack a real wallet pass. Future iterations might integrate PassKit/Google Wallet once certificates are available.
- If more templates are introduced later, extract shared helpers (button renderer, layout constants) into a dedicated module to avoid duplication.
