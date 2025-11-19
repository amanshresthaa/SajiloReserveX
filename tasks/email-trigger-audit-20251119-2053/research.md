---
task: email-trigger-audit
timestamp_utc: 2025-11-19T20:53:22Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Email Trigger Inventory

## Requirements

- Functional: catalog every place emails are triggered and sent (pre/post booking, create/edit/cancel, reminders, admin notifications) with conditions and recipients.
- Non-functional: accuracy and completeness for stakeholders; avoid secrets; align with existing documentation patterns.

## Existing Patterns & Reuse

- Check existing documentation such as `EMAIL_TRIGGERS.md`, `BOOKING_STATUS_LIFECYCLE.md`, and route maps for reference.
- Reuse mailing utilities and event handlers instead of duplicating logic descriptions.

## External Resources

- N/A at this stage.

## Constraints & Risks

- Risk of missing edge-case triggers (manual admin flows, webhook retries).
- Potential drift between docs and current code paths; need to validate against source.

## Open Questions (owner, due)

- None identified yet; will note if new flows appear ambiguous.

## Recommended Direction (with rationale)

- Inventory backend/server email utilities and event handlers to map all send points.
- Cross-reference booking lifecycle states to ensure coverage of each transition.
- Compare findings against existing docs to avoid gaps or contradictions.
