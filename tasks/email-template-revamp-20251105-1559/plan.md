# Implementation Plan: Email Template Revamp

## Objective

Unify and modernize email layout for accessibility, responsiveness, and client compatibility.

## Success Criteria

- [ ] Renders cleanly on Gmail, Outlook, Apple Mail
- [ ] Buttons readable and tappable on mobile
- [ ] Layout stacks on small screens
- [ ] No console/mail header errors during send via Resend

## Architecture & Components

- server/emails/base.ts: renderEmailBase, renderButton, escapeHtml, constants
- Update bookings.ts and invitations.ts to use base

## Data Flow & API Contracts

- No external API changes. Only HTML generation adjusted.

## UI/UX States

- Works with status variants, supports primary/secondary actions, preheader text.

## Edge Cases

- Long venue names, long URLs, missing optional fields.

## Testing Strategy

- Local HTML preview and visual spot checks
- Send test via test-email script (non-production recipients)

## Rollout

- Replace in one PR; monitor delivery complaints.
