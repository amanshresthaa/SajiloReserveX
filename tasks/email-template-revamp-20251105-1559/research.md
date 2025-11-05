# Research: Email Template Revamp

## Requirements

- Functional: Single robust base email layout used by all transactional emails (bookings, invites).
- Non-functional: Accessible semantics, mobile-first responsive, cross-client compatibility (Gmail, Outlook, Apple Mail), bulletproof buttons, safe fonts, max 600px container.

## Existing Patterns & Reuse

- Current emails built via string HTML (server/emails/bookings.ts, invitations.ts) with inline styles and simple responsive classes.
- Resend integration via libs/resend.ts already in place.

## External Resources

- https://www.caniemail.com/ – client support reference
- https://templates.email – layout patterns
- https://www.campaignmonitor.com/resources/will-it-work/email-clients/ – client quirks

## Constraints & Risks

- Outlook desktop requires VML for perfectly rounded CTA buttons.
- Avoid heavy images; keep text-first.
- Keep logic and links identical to current flow.

## Open Questions (owner)

- Should logo/brand header be included? (maintainer)

## Recommended Direction (with rationale)

- Create a shared base renderer with fluid table layout, mobile stacking, and optional header/footer.
- Replace per-email skeletons with base; keep business logic intact.
