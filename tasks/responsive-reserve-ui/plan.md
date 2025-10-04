# Plan: Responsive Enhancements in `reserve`

## Objectives

- Improve small-screen responsiveness and touch targets with minimal, targeted changes.
- Maintain existing visual style and tests; avoid broad refactors.

## Changes

1. OccasionPicker
   - Update grid to `grid-cols-2 sm:grid-cols-3`.
   - Ensure tap targets ≥44px by adding `h-11` on toggle items.

2. Global CSS for `reserve`
   - Add `reserve/app/responsive.css` with:
     - `touch-action: manipulation` on interactive elements.
     - `-webkit-tap-highlight-color: transparent`.
     - Media elements `max-width: 100%; height: auto;` to prevent overflow.
     - Reduced motion support for safety.
   - Import this CSS from `reserve/main.tsx`.

3. Verification
   - Add a unit test to confirm responsive classes in `OccasionPicker`.

## TODOs

- [ ] Patch OccasionPicker grid and item size
- [ ] Add responsive.css and import it
- [ ] Add unit test for responsive classes
