# Implementation Plan: Plan step hydration mismatch

## Objective

Ensure `Calendar24Field` renders identical markup on the server and on the first client render, avoiding hydration errors while still showing slot suggestions after mount.

## Success Criteria

- [ ] No React hydration warnings in Plan step when loading `/reserve/r/<slug>`.
- [ ] Time input `step` and `list` attributes are stable between SSR and first client render.
- [ ] Slot suggestions and datalist continue to work post-hydration.

## Architecture & Components

- `Calendar24Field.tsx`
  - Add a `hasHydrated` state (initialized `false`, set `true` in `useEffect`).
  - Gate `timeStepSeconds`, `showSuggestions`, and `datalist` rendering on `hasHydrated` to keep SSR output deterministic.
  - Provide fallback copy until hydration completes.

## Data Flow & API Contracts

- No backend/API changes; purely client rendering adjustments.

## UI/UX States

- Before hydration: existing fallback message remains visible.
- After hydration: datalist/time suggestions appear and behave exactly as before.

## Edge Cases

- Wizard with disabled time field should continue hiding suggestions even after hydration.
- Component should not attempt to render datalist when `document` is unavailable.

## Testing Strategy

- Manual: load `/reserve/r/<slug>` in dev server, note absence of hydration warnings, ensure suggestions still appear when slots exist.
- Automated: rely on existing component tests (none specific to hydration); lint covers regressions.

## Rollout

- No feature flag. Document findings in `verification.md` once QA complete.
