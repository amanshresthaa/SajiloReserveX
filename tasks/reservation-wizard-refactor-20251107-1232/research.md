# Research: Reservation Wizard Refactor

## Requirements

- Functional:
  - Harden Plan step schedule prefetching (abortable requests, dedupe, loading state exposure) to eliminate race conditions and wasted queries.
  - Prevent Confirmation step memory leaks by guarding async state updates, adding abort controls for sharing flows, and exposing safe setters.
  - Offer user-controlled auto-redirect in Confirmation UI with session persistence and accessible announcements.
  - Introduce reusable error boundaries for each wizard step with logging + recovery actions.
  - Optimize heavy UI surfaces (memoized venue derivation, virtualized time slot grid, cached date normalization) and expose loading skeletons.
  - Improve accessibility (keyboard navigation for slots, structured forms, ARIA/live regions, checkbox semantics).
  - Add wizard-level context provider to reduce prop drilling + centralize navigation, plus sanitize user inputs in schemas.
  - Integrate debouncing/throttling utilities, share abort signals, and document/test the flow.
- Non-functional (a11y, perf, security, privacy, i18n):
  - WCAG-compliant focus + announcements for new UI (TimeSlotGrid, Confirmation auto-redirect, forms).
  - Performance: avoid duplicate fetches, render only visible times, reduce re-renders, keep schedule prefetch under control.
  - Security/privacy: sanitize potentially malicious inputs (names, notes, email, phone) and block disposable email patterns.
  - Internationalization: keep copy consistent and friendly; ensure countdown + alerts accessible to SRs.
  - Reliability: use React Query abort + cleanup to avoid dangling promises when navigating quickly.

## Existing Patterns & Reuse

- Wizard already relies on `useWizardStore`, `WizardStep`, and per-step hooks (`usePlanStepForm`, `useDetailsStepForm`, `useReviewStep`, `useConfirmationStep`). We'll extend these rather than rewriting flows.
- Prefetching currently lives inside `usePlanStepForm` via `useQueryClient.fetchQuery`; we can augment that logic with refs/maps while staying compatible with React Query cache keys defined in `scheduleQueryKey`.
- Shared UI primitives (`@shared/ui/*`, `@shared/lib/cn`, etc.) already cover alerts, accordions, buttons—reuse to keep styling consistent.
- `WizardDependencies` DI container already exposes `errorReporter`, `analytics`, and other infra; we can send boundary events through it or, at minimum, console.warn in dev.
- Input schemas leverage Zod today, so sanitization can be layered via `.transform` + `.refine` without rewriting forms.

## External Resources

- [TanStack React Virtual docs](https://tanstack.com/virtual/latest/docs/framework/react/overview) — reference for setting up `useVirtualizer`, overscan, scroll-to-index.
- [AbortController MDN](https://developer.mozilla.org/docs/Web/API/AbortController) — ensure multi-signal usage with `AbortSignal.any` for React Query compatibility.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) — guidance for keyboard grids, live regions, and form labelling to meet the enhanced a11y requirements.

## Constraints & Risks

- Need to respect existing analytics + error tracking; avoid noisy logging in production (guard via `process.env.NODE_ENV`).
- Wizard runs client-side within Next/Vite SPA runtime—new context/provider must not break suspense or SSR boundaries.
- React Hook Form expects synchronous field registrations; ensure sanitization transforms do not desync with stored state.
- Virtualization must preserve keyboard/focus order; failure could regress accessibility despite perf gains.
- Abort handling must avoid aborting React Query internals erroneously; combine signals carefully and clear maps on unmount to prevent leaks.
- Adding dependencies (e.g., `@tanstack/react-virtual`) requires lockfile updates and may impact bundle size—ensure tree-shaking.

## Open Questions (owner, due)

- Q: Do we need to support older browsers lacking `AbortSignal.any`? (owner: engineering) — assume polyfill or modern browsers only per current stack; document fallback monitoring.
- Q: Should disposable email domain list be configurable? (owner: product) — default to static set now; note follow-up.

## Recommended Direction (with rationale)

- Follow the provided phased roadmap, layering safety + UX fixes before broader architecture:
  1. Enhance `usePlanStepForm` with abortable, deduped schedule prefetching, track `loadingDates`, and return that state for UI skeletons. Verify cleanup on slug/date changes.
  2. Fortify `useConfirmationStep`/UI (mounted ref, abort share calls, user-controlled redirects) and propagate abort signals into `shareReservationDetails`.
  3. Add reusable error boundaries + wrap each step to contain crashes while logging through dependencies.
  4. Introduce `WizardContext` provider to expose state/actions and refactor steps + forms to consume context, reducing prop drilling.
  5. Improve performance (memoized venue object, `TimeSlotGrid` virtualization, normalized date caching, debounced prefetch) and accessibility (keyboard navigation, form semantics, live regions).
  6. Add sanitization utilities + integrate into Zod schemas plus new loading skeleton + docs/testing to cement reliability.
