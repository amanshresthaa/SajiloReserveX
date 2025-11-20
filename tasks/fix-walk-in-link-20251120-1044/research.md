---
task: fix-walk-in-link
timestamp_utc: 2025-11-20T10:44:49Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix walk-in link routing

## Requirements

- Functional: ensure the “Log walk-in” button from the bookings view renders the walk-in flow instead of a 404/page-not-found.
- Non-functional: preserve existing auth redirect behavior and routing conventions; no regressions to bookings list UX.

## Existing Patterns & Reuse

- Ops bookings page uses `<Link href="/app/walk-in">Log walk-in</Link>` in `src/components/features/bookings/OpsBookingsClient.tsx`.
- `/app/walk-in` page exists at `src/app/app/(app)/walk-in/page.tsx` with auth guard and client wizard.
- Public `/walk-in` path redirects to `/app/walk-in` (`src/app/walk-in/page.tsx`).

## External Resources

- None needed; internal routing patterns are sufficient.

## Constraints & Risks

- Must avoid breaking existing ops routes; ensure correct segment path (app router nesting).
- Auth redirect should remain intact.

## Open Questions (owner, due)

- None identified.

## Recommended Direction (with rationale)

- Adjust the link target to match the actual walk-in page segment (`/app/app/walk-in` if required by nesting) or update routing to ensure `/app/walk-in` resolves; prefer minimal path correction in the button to hit the existing page component.
