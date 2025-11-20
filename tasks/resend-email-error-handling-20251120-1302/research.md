---
task: resend-email-error-handling
timestamp_utc: 2025-11-20T13:02:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Resend Email Error Handling

## Requirements

- Functional: prevent or catch malformed `from` addresses when sending emails via Resend and return a user-friendly API error; keep audit logging meaningful.
- Non-functional: no secrets in logs; align with existing invite email flow; maintain observability and clear stack traces.

## Existing Patterns & Reuse

- `libs/resend.ts` centralizes sending and normalizes errors; team invite emails use `sendTeamInviteEmail` in `server/emails/invitations.ts`.
- Existing error normalization already wraps Resend errors but currently throws generic Error after logging; REST route (`src/app/api/v1/ops/team/invitations/route.ts`) returns 500.

## External Resources

- Resend API format requirement: `from` must be `email@example.com` or `Name <email@example.com>`.

## Constraints & Risks

- Email sending must not expose sensitive config; avoid leaking full headers.
- Changing API responses could impact clients expecting current shape; need to preserve envelope structure while improving messaging.

## Open Questions (owner, due)

- Should we default to a configured fallback `from` address if validation fails? (TODO: confirm with maintainers if needed.)

## Recommended Direction (with rationale)

- Validate or sanitize `from` before calling Resend; if invalid, fail fast with 400-level response instead of 500 where possible.
- Map Resend validation errors to structured API errors with actionable message and safe logging.
- Keep logging readable while avoiding double `from` formatting.
