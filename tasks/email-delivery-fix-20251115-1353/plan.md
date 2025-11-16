---
task: email-delivery-fix
timestamp_utc: 2025-11-15T13:53:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Booking emails not delivered

## Objective

Ensure the Resend integration fails fast (and loudly) when the API rejects an email so operators know delivery status and can trace successful sends via logged IDs.

## Success Criteria

- [ ] `sendEmail` throws with a descriptive Resend error when the SDK response contains `error` or lacks an ID.
- [ ] Logs include the Resend error code/message on failures and a real ID on success.
- [ ] A unit test covers the failure path to guard against regressions without live API calls.

## Architecture & Components

- `libs/resend.ts`: enhance `sendEmail` to inspect the SDK response, throw typed errors, and update logging.
- `tests/server/libs/resend-send.test.ts` (new): mock the Resend client to verify we throw when API responds with `error` or missing ID.

## Data Flow & API Contracts

- No external contract changes. Internal `sendEmail` promise will now reject instead of quietly resolving when Resend responds with `{ data: null, error: {...} }`.

## UI/UX States

- Not applicable (server-side behavior only).

## Edge Cases

- Resend returning `{ data: null, error }` → throw an error that includes `error.name` + `error.message`.
- Resend returning `{ data: { id?: undefined }, error: null }` → treat as failure (log + throw) since we cannot confirm delivery.
- Successful path should keep attachments + existing logging intact.

## Testing Strategy

- Unit: Vitest suite for `sendEmail` mocking the Resend client to simulate both error and success with missing ID.
- Existing integration flows already rely on `sendEmail` throwing; no extra e2e needed.

## Rollout

- No feature flags. Change is limited to server email helper, so deploy via normal release once tests pass.

## DB Change Plan (if applicable)

- N/A.
