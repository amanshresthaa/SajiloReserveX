# Research: Customer Frontend Architecture Without Pricing/Stripe

## Scope Clarification

- User confirmed focus is limited to frontend architecture docs; no direct code or backend changes needed right now.
- Pricing upgrade flow and Stripe checkout will not ship in the near term; plans must exclude these while keeping the rest of the customer experience coherent.

## Existing Architecture Patterns

- **Framework**: Next.js App Router with feature-based folders under `app/` and `reserve/features`. Client components marked via `'use client'` and rely on React hooks heavily.
- **State**: TanStack React Query (v5) for server state and React Hook Form for complex forms (`DetailsStep.tsx`). Query key factory documented in `tasks/customer-frontend-architecture/05-state-management.ts` with invalidate helpers for bookings/profile.
- **Design System**: Shadcn-derived components in `components/ui` and re-exported via `@shared/ui/*`. Forms use `Form`, `FormField`, `Input`, `Checkbox`, etc., maintaining accessibility semantics.
- **Analytics**: Central tracking via `@/lib/analytics`, `emit`, and Vitest coverage (e.g., `plan-step-form.analytics.test.tsx`, `review-step.analytics.test.tsx`). Events follow snake_case names with payload objects. Tests assert `onTrack` calls.
- **Reservations Flow**: Multi-step wizard under `reserve/features/reservations/wizard`. Steps rely on dependency injection (`useWizardDependencies`) to access analytics. UI ensures accessible focus management (e.g., `DetailsStep` uses `react-hook-form`, `Accordion` to surface errors).
- **Customer Surfaces**: Existing `ReservationDetailClient.tsx` demonstrates post-booking management (cancel/edit dialogs, share, analytics). Uses `Shadcn` buttons, alerts, skeletons, and ensures network offline tracking.

## Documentation Baseline

- `tasks/customer-frontend-architecture/plan.md` defines 12-step spec covering IA, content, routing, state, components, design tokens, edge cases, performance, analytics, acceptance tests.
- Current sprint docs (`sprint-plan.md`, `sprint-2-plan.md`, `sprint-3-plan.md`) still prioritize pricing page, Stripe checkout, and related analytics events.
- `03-content-specification.md`, `02-information-architecture.json`, and analytics specs include `/pricing`, `pricing_checkout_clicked`, and Stripe-specific copy that must be pruned or reframed.

## Constraints & Standards to Honor

- Mobile-first development and TDD explicitly required; existing tests demonstrate Vitest + React Testing Library patterns and analytics assertions.
- Accessibility rules detailed in user instructions: focus management, 24px targets, inline validation, aria-live for feedback, ensures usage of `touch-action: manipulation`, etc.
- Performance expectations: React Query config ensures refetch on focus, offline handling; instructions emphasize Core Web Vitals budgets and profiling.
- Must continue using Shadcn components and design tokens; verify that planned surfaces align with existing design system.

## Opportunities for Updated Plan

- Reframe customer-facing roadmap around reservation discovery, booking wizard, account management, and analytics hardening—drop pricing deliverables.
- Update analytics taxonomy to remove pricing events, focus on bookings, profile updates, auth flows.
- Adjust IA and routing docs: remove `/pricing` node; highlight `/reserve`, `/signin`, `/dashboard`, `/profile`, `/blog`.
- Ensure sprint backlog focuses on strengthening reservation flows, auth guardrails, analytics reliability, and marketing content that does not involve checkout.
