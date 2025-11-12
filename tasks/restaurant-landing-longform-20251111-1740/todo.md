# Implementation Checklist

## Setup

- [x] Finalize requirements/plan for restaurant landing page.

## Core

- [x] Scaffold new Next.js route for restaurant partners.
- [x] Build hero + CTA with restaurant-specific messaging.
- [x] Add sections (problem, solution, features, testimonials, pricing) referencing repo assets.
- [x] Ensure CTAs point to restaurant auth/onboarding flows only.
- [x] Replace the existing `/` page with the restaurant landing component + layout.
- [x] Deduplicate section logic by exporting a shared `RestaurantLandingPage` component used by both `/` and `/partners`.

## UI/UX

- [x] Responsive layout
- [ ] Loading/empty/error states (if any async data)
- [x] A11y roles, headings, focus mgmt (update after homepage swap)

## Tests

- [ ] Unit/story or snapshot coverage if applicable
- [ ] Integration/e2e if relevant
- [ ] Accessibility checks

## Notes

- Assumptions: (tbd)
- Deviations: (tbd)

## Batched Questions (if any)

- None yet
