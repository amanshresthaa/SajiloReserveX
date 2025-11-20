---
task: resend-email-error-handling
timestamp_utc: 2025-11-20T13:02:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Resend Email Error Handling

## Objective

Ensure invite emails fail fast with clear, structured errors when the `from` field is invalid, and return client-safe responses without losing observability.

## Success Criteria

- [ ] Requests with malformed `from` values return a 400-style structured error (not 500) with actionable message.
- [ ] Logs capture normalized Resend errors without redundant headers and no secrets.
- [ ] Happy-path sending remains unchanged and existing API response shape stays stable.

## Architecture & Components

- `libs/resend.ts`: enhance normalization to detect validation errors and expose typed result.
- `server/emails/invitations.ts`: adapt to new error handling; avoid double `from` formatting.
- `src/app/api/v1/ops/team/invitations/route.ts`: map validation errors to 400 response payload.

## Data Flow & API Contracts

- When send invoked, validate `from` format ahead of Resend call; if invalid, throw typed `ResendValidationError` containing field + message.
- API route catches typed errors and responds with `{ error: { code, message, details } }`, HTTP 400; otherwise default to 500.

## UI/UX States

- N/A (API only); ensure client surface gets meaningful message.

## Edge Cases

- Missing `from` env config.
- Multiple `from` headers concatenated.
- Unexpected Resend error types (network, auth) should continue to 500.

## Testing Strategy

- Unit-ish: add/extend tests if present (likely manual via dev server) or simulate call via handler with invalid `from`.
- Manual: exercise invite POST with invalid `from` to verify 400; with valid to ensure success unaffected.

## Rollout

- No feature flag; small scoped change. Monitor logs for invite errors after deploy.

## DB Change Plan (if applicable)

- N/A.
