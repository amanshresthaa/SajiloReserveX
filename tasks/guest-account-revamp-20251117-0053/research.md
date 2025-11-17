---
task: guest-account-revamp
timestamp_utc: 2025-11-17T00:54:03Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: high
flags: [feat.guest_account_revamp]
related_tickets: []
---

# Research: Guest Account Revamp

## Requirements

- Functional: modernize guest account IA and flows (invite/onboarding, bookings list/detail with key actions, profile/manage with preferences and security entry); add clear CTAs and copy; feature flag for rollout.
- Non-functional: WCAG 2.1 AA (keyboard, focus, contrast, labels); mobile-first; performant (good CWV); i18n-ready copy and formatting.

## Existing Patterns & Reuse

- TBD: catalog current guest-account components, hooks, and layouts for reuse; prefer existing design system and shadcn components.

## External Resources

- None yet; to add Context7/DeepWiki references if needed for best practices.

## Constraints & Risks

- Must retain existing auth/guest-session logic and business rules for cancellations/changes.
- Avoid new frameworks; keep pages lightweight; minimize client-side bloat.
- Must improve contrast/focus states; avoid color-only status indicators.
- Revamp behind feature flag feat.guest_account_revamp for gradual rollout.

## Open Questions (owner, due)

- Q: Any mandated copy/brand tokens beyond current design system? (owner: PM/design, due: ASAP)
- Q: Which locales must be supported at launch? (owner: PM, due: ASAP)
- Q: Do we need analytics events updates for new flows? (owner: Eng/PM, due: before implementation)

## Recommended Direction (with rationale)

- Reorganize IA with clear nav and page titles for Invites, My Bookings, and Profile.
- Use existing design-system + shadcn components with improved spacing, cards, and status chips for clarity and trust.
- Mobile-first card layouts with sticky primary actions where appropriate; clear empty/error states with gentle illustrations/icons.
- Implement accessible forms and focus management; ensure status uses text+icon, not color alone.
- Localize all copy via existing i18n patterns; ensure dates/currency respect locale.
- Ship behind feature flag feat.guest_account_revamp; plan A/B or staged rollout.
