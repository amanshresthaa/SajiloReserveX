---
task: my-bookings-revamp
timestamp_utc: 2025-11-17T11:21:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: My bookings guest home revamp

## Requirements

- Functional:
  - Revamp `/my-bookings` into a richer, personalized guest home that highlights upcoming bookings, quick actions, and helpful guidance.
  - Keep core booking management intact (view list, search/filter, edit, cancel).
  - Surface next booking prominently and encourage new bookings/profile updates.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Maintain WCAG/a11y patterns (keyboard focus, semantic headings, button/link roles).
  - Ensure responsive layout (mobile → desktop) with no layout shift on load; reuse existing data fetch to avoid perf regressions.
  - No secrets in code; Supabase remains remote-only; keep auth redirect behavior.

## Existing Patterns & Reuse

- `src/app/(guest-account)/my-bookings/page.tsx` uses `PageShell`, `InfoCard`, server-side prefetch via React Query, and redirects unauthenticated users.
- `MyBookingsClient` already handles booking list/table, spotlight of next booking, and edit/cancel dialogs using `useBookings` + `useBookingsTableState` and shared dashboard components.
- Support email pulled from `config.email.supportEmail`; profile flows live at `/profile/manage` using `getOrCreateProfile`.
- Layout: `CustomerNavbar` + `PageShell` gradient background; uses shadcn UI primitives (Card, Button, Alert, etc.).

## External Resources

- Internal route map/docs (`docs/route-flow.md`, `COMPLETE_ROUTE_MAP.md`) confirm `/my-bookings` is the guest account home and must redirect unauthenticated users.

## Constraints & Risks

- Personalized data limited to Supabase user/profile; avoid adding new backend APIs unless necessary.
- Must keep booking actions functional; regressions in table/search/pagination would break flows and tests.
- Manual Chrome DevTools MCP QA required for UI changes.
- Perf budgets: avoid heavy client logic; reuse existing queries instead of new round-trips when possible.

## Open Questions (owner, due)

- Should personalization use profile name (`profiles.name`) or fallback to email when missing? (assume: prefer name, fallback to email prefix.)
- Are there additional insights (e.g., loyalty, recent restaurants) available elsewhere? (none obvious; stay within bookings data.)

## Recommended Direction (with rationale)

- Keep existing bookings data pipeline intact; wrap it in a redesigned, home-like layout with greeting, quick actions, and helpful cards.
- Pull profile (name/email/phone) server-side to personalize header and show a “profile completeness” prompt with CTA to `/profile/manage`.
- Highlight the next booking with richer context and friendly copy; keep table below for full management.
- Add quick-action grid (New booking, Manage profile, Contact support) and guidance cards (e.g., day-of tips, cancellation policy) using existing shadcn components.
