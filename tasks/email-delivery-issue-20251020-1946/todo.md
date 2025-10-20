# Implementation Checklist

## Setup

- [x] Review current Resend configuration and confirm domain status with SDK
- [ ] Capture baseline: send test email and record Resend delivery event IDs

## Core

- [x] Pull support email / from labels from env instead of hard-coded config defaults
- [x] Harden `libs/resend.ts` reply-to handling (fallback + warnings)
- [x] Add Resend diagnostics CLI under `scripts/email/check-resend-status.ts`
- [x] Wire CLI via `package.json` script and ensure TypeScript config includes new file (if needed)

## UI/UX

- [ ] N/A (no UI changes planned)

## Tests

- [x] Add unit coverage for reply-to helper logic
- [x] Add tests for diagnostics CLI with mocked Resend SDK

## Notes

- Assumptions:
- Deviations:
  - Skipped new baseline email send; relied on existing Resend events via diagnostics CLI.

## Batched Questions (if any)

- ...
