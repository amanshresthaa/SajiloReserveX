---
task: customer-nav-consistency
timestamp_utc: 2025-11-17T00:14:00Z
owner: github:@assistant
reviewers: []
risk: medium
flags: []
related_tickets: []
---

# Research: Customer Nav/Footer Consistency

## Requirements

- Functional: unify navbar/footer experience across customer-facing routes (`/`, `/browse`, `/signin`, `/reserve*`, `/item/[slug]`, `/invite/[token]`, `/my-bookings`, `/profile/manage`, `/thank-you`); keep relevant links (logo, Browse, My bookings, Profile, Sign in/Sign out); use hamburger/sheet on mobile.
- Non-functional: maintain Tailwind/shadcn defaults; improve mobile responsiveness; address known pain points (padding, alignment, focus/keyboard, CLS).

## Existing Patterns & Reuse

- Shared layouts already exist for guest experience and guest account (`src/app/(guest-public)/(guest-experience)/layout.tsx`, `src/app/(guest-account)/layout.tsx`) using `CustomerNavbar` + `Footer`.
- Marketing layout uses `OwnerMarketingNavbar` + `OwnerMarketingFooter` (`src/app/(guest-public)/(marketing)/layout.tsx`).
- `CustomerNavbar` lives in `components/customer/navigation/CustomerNavbar.tsx`; exported via `components/customer/navigation/index.ts`.
- `Footer` is `components/Footer.tsx` with pricing/blog links and legal links.

## External Resources

- N/A (no external docs needed beyond repo components).

## Constraints & Risks

- Must avoid breaking routing groups; keep existing auth/state logic in `CustomerNavbar`.
- Need to ensure a11y for nav (keyboard, focus-visible) and mobile sheet.
- UX differences between marketing vs guest routes: confirm if landing `/` should use customer or marketing chrome (currently marketing).

## Open Questions (owner, due)

- None raised; user specified nav links and simple footer.

## Recommended Direction (with rationale)

- Standardize customer nav links (logo→landing, Browse, My bookings, Profile, Sign in/out) in `CustomerNavbar` with responsive hamburger + sheet.
- Simplify Footer to copyright-only variant for customer flows; keep marketing footer for marketing pages.
- Apply consistent spacing/typography in layouts and adjust padding/margins on mobile for nav/footer components to reduce pain points.
