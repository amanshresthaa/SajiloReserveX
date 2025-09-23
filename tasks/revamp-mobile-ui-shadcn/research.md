# Research: Revamp Mobile-First UI with shadcn/ui + Tailwind

Date: 2025-09-23

## Codebase Inventory
- Framework: Next.js (app router) present in `app/`.
- Tailwind CSS v4 configured (`app/globals.css`, `tailwind.config.js`). DaisyUI plugin present but not required for spec.
- shadcn/ui setup detected via `components.json` and `components/ui/*` (button, card, input, etc.).
- Utility: `lib/utils.ts` includes `cn` and `tailwind-merge` integration.
- Fonts: Inter via `next/font/google` in `app/layout.tsx`. No “SajiloReserveX Cereal App” webfont present.
- Global CSS already defines many CSS variables for colors/spacing but not matching AGENTS.md tokens.

## Gaps vs AGENTS.md
- Design tokens: Missing exact tokens (font family name, pink primary #FF385C, pressed #E01D45, accent #00A699, text + surface + border colors, spacing names, radius values 8/12/16, shadow definitions).
- Typography scale: Not explicitly mapped to Tailwind classes (`screen-title`, `section-header`, etc.).
- Components: PrimaryButton, SearchBar, CategoryTab, ExperienceCard not yet implemented to spec.
- Navigation: Bottom tab bar (5 tabs) not implemented. No mobile `(mobile)` layout with persistent tabs.
- Screens: Explore, Experience Details, Trip Itinerary, Profile missing. (Trips/messages/profile exist conceptually only).
- Animations: Shimmer exists; need button press scale 0.98 (partially in button), modal slide-up (300ms ease-out), standardized easings and durations.
- Accessibility: Focus-visible outline using primary color; ARIA roles for tabs; touch target 44px min.

## Constraints / Considerations
- Keep existing pages intact; add a dedicated mobile group `(mobile)` with its own layout and routes `/explore`, `/wishlists`, `/trips`, `/messages`, `/profile`.
- Use shadcn/ui primitives but override tokens to match AGENTS.md in Tailwind and CSS variables.
- Tailwind v4 supports CSS variables well; we can expose new tokens via `:root` and `theme.extend` for colors/shadows/radius.
- Font family: Use `"SajiloReserveX Cereal App", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` as CSS fallback until a font file is provided.

## References Cross-Checked
- AGENTS.md tokens and component specs (this repo `agents.md`).
- shadcn/ui theming via Tailwind variables (existing `components.json`).
- Tailwind default spacing scale matches 8px grid (1→4px, 2→8px, 3→12px, 4→16px, 5→20px, 6→24px, 8→32px, 10→40px, 12→48px).

## Risks / Unknowns
- Custom font not available; will use fallback family name exactly as requested for later swap-in.
- DaisyUI is present; ensure new tokens don’t conflict. We’ll scope token names to `--color-*` etc. and use explicit Tailwind classnames.
- Modal behavior and deep interactions beyond UI are out of scope; we will provide representative UX and hooks for wiring data.

