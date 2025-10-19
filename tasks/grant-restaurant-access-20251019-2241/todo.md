# Implementation Checklist

## Setup

- [ ] Confirm target Supabase environment and connection

## Core

- [x] Draft SQL to ensure user exists (invite if needed)
- [x] Add profile entry and memberships for all restaurants

## Tests

- [ ] Validate inserts succeed (dry run)

## Notes

- Assumptions:
- Assumptions: Maintainer will execute SQL against the desired environment; assumes `auth.invite_user_by_email` available.
- Deviations: No live execution performed; validation pending.

## Batched Questions

- None yet
