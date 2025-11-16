---
task: ops-magic-link-dev
timestamp_utc: 2025-11-15T13:41:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Plan: Ops magic-link failures in local dev

## Objective

Prevent `next dev` from silently switching away from port 3000 so Supabase magic-link callbacks always target an allowlisted origin.

## Success Criteria

- [ ] `pnpm run dev` aborts with a clear message when port 3000 is occupied.
- [ ] Happy-path remains unchanged when the port is free.
- [ ] Documentation/tasks capture the guard so others understand the behavior.

## Architecture & Components

- `scripts/ensure-dev-port.ts`: new script that probes the configured port and exits non-zero if busy.
- `package.json`: update `predev` script to invoke the new checker after env validation.

## Data Flow & API Contracts

- Script reads `PORT` env (default 3000) and optionally `DEV_HOST` (default `127.0.0.1`). No external APIs.

## UI/UX States

- CLI output should explain why dev server stopped and reference Supabase magic-link requirement.

## Edge Cases

- Handle `EACCES` or other network errors gracefully with actionable logs.
- Support customized `PORT` via env for future-proofing.

## Testing Strategy

- Manual: occupy port 3000 (e.g., `python -m http.server 3000`), run `pnpm run dev`, confirm guard fails with message.
- Manual: ensure `pnpm run dev` still starts cleanly when port free.

## Rollout

- No feature flags. Documented via this task.

## DB Change Plan

- N/A.
