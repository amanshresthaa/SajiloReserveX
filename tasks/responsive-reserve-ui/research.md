# Research: Responsive Design in `reserve`

Date: 2025-10-04

## Goal

Elevate responsive design in the `reserve` package with pragmatic, low-risk changes that improve small-screen usability, hit targets, and layout flexibility while respecting existing visual language and tests.

## Current State

- Styling: Tailwind utility classes embedded in components. No dedicated CSS within `reserve`, but index.html includes mobile-friendly viewport meta.
- Layout patterns:
  - `WizardLayout` uses responsive paddings and `max-w-5xl` container; good.
  - Grids use variants like `md:grid-cols-2`, `sm:grid-cols-2 lg:grid-cols-3` in several places; good.
  - Footer (`WizardFooter`) is fixed with safe-area padding and responsive spacing; good.
  - `Calendar24Field` uses `flex-col md:flex-row`; good.
- Potential responsiveness gaps:
  - `OccasionPicker` uses a static `grid grid-cols-3`; likely cramped on small screens.
  - Toggle buttons default height is `h-9` (~36px) which is below mobile target ≥44px.
  - No `reserve`-local global CSS to enforce touch affordances (`touch-action: manipulation`) and tap highlight color.

## Risks / Constraints

- The `reserve` app may run standalone (Vite) and within tests (jsdom); CSS should be minimal and safe.
- Shifting global styles could cause visual deltas; keep changes scoped and conservative.

## High-Value Targets

1. Make `OccasionPicker` grid responsive (`grid-cols-2 sm:grid-cols-3`) and increase tap target.
2. Add a tiny `reserve` global CSS for touch affordances and overflow-safe media.
3. Add a lightweight test to verify responsive class presence for `OccasionPicker`.
