# Sprint S7 — Dependency Injection Foundations: Research

## Objective

Prepare to introduce DI interfaces (`AnalyticsTracker`, `HapticsClient`, `Navigator`) and a lightweight provider so the reservation wizard no longer imports global singletons directly.

## Current behaviour snapshot

- `useReservationWizard.ts` imports and uses:
  - `track` from `@shared/lib/analytics` inside `handleConfirm`.
  - `triggerSubtleHaptic` from `@reserve/shared/lib/haptics` inside step change + sticky visibility effects.
  - `useNavigate` from `react-router-dom` for redirection (`handleClose`).
- Other hooks/components (`useReviewStep`, `ReservationDetailClient`) also call `track` directly but S7 scope explicitly mentions wizard entry points.
- No shared context/provider exists for wizard-level dependencies; components rely on global imports.

## Patterns & constraints

- Wizard state/actions live in `useWizardStore` (Zustand). Hook returns `state` and `actions` consumed across UI.
- Analytics + haptics utilities are pure functions with browser checks—safe to inject.
- Navigation currently relies on `useNavigate`; for DI we likely expose a wrapper (interface with `push`, `replace`, etc.) backed by router in default implementation.
- We already have DI-oriented goals from sprint plan (S7) expecting ability to inject no-op trackers during tests.

## Existing testing pain points

- Wizard tests (e.g., `reserve/features/reservations/wizard/model/__tests__`) focus on store logic. No easy way to stub analytics or haptics because they’re imported directly.
- Introducing DI would allow tests to provide no-op analytics/haptics without relying on module mocks.

## Implementation considerations

- Need a provider (React context) accessible from wizard entry points (`useReservationWizard`) while keeping backward compatibility for existing hook signature.
- Define TypeScript interfaces for tracker/haptics/navigator with sensible defaults (no-op tracker, `triggerSubtleHaptic`, react-router navigate adapter).
- Ensure server-side rendering safety: default implementations should tolerate SSR (guarded as current functions do).
- Update consumption sites (hook + possibly child components) to read from context instead of direct imports.

## Risks / open questions

- Identify how to expose provider setup to booking flow route (likely wrap `ReservationWizard` usage with new provider).
- Determine whether we need hooks for DI consumption (`useWizardDependencies`) vs. hooking directly in `useReservationWizard`.
- Confirm whether analytics events elsewhere should also adopt DI now or remain for future sprints.

## Verification baseline

- `pnpm test` and `pnpm lint` currently pass (aside from known `useCallback` dependency warnings).
- No existing DI structures to migrate; will need new context + tests covering both default behaviour and injected overrides.
