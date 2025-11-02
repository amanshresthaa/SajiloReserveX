# Implementation Plan: Server Clock & Hold Ownership (E5-S1)

## Objective

Make server time authoritative for countdowns and enforce hold extension ownership and authorization.

## Success Criteria

- [ ] `serverNow` returned by hold create + context.
- [ ] Unauthorized extend returns `AUTH_FORBIDDEN`.

## Architecture & Components

- Tables service: include `serverNow` in results.
- Holds service: add authorization to `extendTableHold` (creator or elevated role on restaurant).
- Manual routes: pass `actorId` and enforce checks.

## Testing Strategy

- Unit: authorization guard in `extendTableHold`.
- Integration: countdown stable across reloads (use `serverNow`).
