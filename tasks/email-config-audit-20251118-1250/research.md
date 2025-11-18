---
task: email-config-audit
timestamp_utc: 2025-11-18T12:50:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Email Configuration Audit

## Requirements

- Inventory current email configuration (providers, env keys, routes, services) and document why/when each email is sent.
- Produce a concise Markdown summary for maintainers.

## Existing Patterns & Reuse

- Central config in `config.ts` with `email` section (from env).
- API email helpers in `server/email` and `scripts/email`.
- Booking-related emails in `server/capacity` flows and `/api` routes.

## Constraints & Risks

- Avoid exposing secrets; only reference env var names and behaviors.
- Focus on current codebase behavior (not future plans).

## Open Questions

- None identified.

## Recommended Direction

- Scan `config.ts` and server email utilities/routes to list triggers and templates.
- Summarize in Markdown under `tasks/email-config-audit-20251118-1250/email-summary.md`.
