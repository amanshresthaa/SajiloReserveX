# Plan: SajiloReserveX Mobile-First UI Revamp (React + shadcn/ui + Tailwind)

Date: 2025-09-23

## Goals
- Implement a mobile-first interface adhering strictly to AGENTS.md tokens and patterns.
- Use shadcn/ui as the base, customizing via Tailwind tokens and CSS variables.
- Deliver 5-tab bottom navigation with these core screens: Explore, Wishlists, Trips, Messages, Profile, plus Experience Details.
- Implement key components: PrimaryButton, SearchBar, CategoryTab, ExperienceCard.
- Apply animation guidelines: button press scale 0.98, modal slide-up (300ms ease-out), shimmer loading.
- Enforce accessibility: focus-visible outlines, ARIA tab semantics, alt/aria labels.

## Architecture
- Create a `(mobile)` route group: `app/(mobile)/layout.tsx` persists BottomTabs; child routes for each tab and detail screen.
- Encapsulate mobile components under `components/mobile/*` to avoid conflicts.
- Inject design tokens into `app/globals.css` with CSS variables and Tailwind mappings in `tailwind.config.js`.

## Design Tokens (from AGENTS.md)
- Font family: `"SajiloReserveX Cereal App", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Colors: `--color-primary #FF385C`, `--color-primary-pressed #E01D45`, `--color-accent #00A699`, text (`#222222`, `#717171`), on-primary `#FFFFFF`, surfaces (`#FFFFFF`, `#F7F7F7`), border `#DDDDDD`.
- Spacing: 8px grid — 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48; constants `--screen-margin:24px`, `--card-padding:12px`, `--button-height:48px`, `--touch-target:44px`.
- Radius: sm 8px, md 12px, lg 16px, full 9999px.
- Shadows: card `0 4px 12px rgba(0,0,0,0.1)`, header `0 2px 4px rgba(0,0,0,0.08)`, modal `0 8px 32px rgba(0,0,0,0.12)`.
- Type scale: screen-title 700 34/40, section-header 600 22/28, card-title 600 18/22, body 400 16/24, label 400 14/20, button 600 16/20.

## Tailwind Integration
- Add Tailwind theme extensions:
  - colors: `sr.primary`, `sr.primaryPressed`, `sr.accent`, `sr.text.primary`, `sr.text.secondary`, `sr.onPrimary`, `sr.surface`, `sr.background`, `sr.border` mapping to CSS vars.
  - fontFamily: `sans` set to SajiloReserveX stack.
  - fontSize utilities: `screen-title`, `section-header`, `card-title`, `body`, `label`, `button`.
  - borderRadius: `sr-sm 8px`, `sr-md 12px`, `sr-lg 16px`, `full`.
  - boxShadow: `card`, `header`, `modal` per spec.
  - spacing constants via CSS vars: `screen-margin`, `card-padding`, `button-height`, `touch-target`.
- Add CSS classes for animations: `.button-press`, `.modal-enter`, `.screen-transition`, `.loading` shimmer, `.focus-visible` outline.

## Components
- PrimaryButton (`components/mobile/PrimaryButton.tsx`): wraps shadcn Button with `variant="primary"`, height 48px, px-6, radius md (12px), bg `--color-primary`, pressed `--color-primary-pressed`, active scale 0.98, aria-label optional.
- SearchBar (`components/mobile/SearchBar.tsx`): 52px height pill, surface bg, card shadow, px-4, placeholder, aria-label, `role="search"`, keyboard focus ring.
- CategoryTab (`components/mobile/CategoryTab.tsx`): sized touch target ≥44px, underline for active, `role="tab"`, `aria-selected`.
- ExperienceCard (`components/mobile/ExperienceCard.tsx`): image 1:1, radius 16, card shadow, wishlist button top-right (aria-label), content padding 12/16, tap highlight scale subtle.
- BottomTabs (`components/mobile/BottomTabs.tsx`): fixed bottom, 83px, shadow-header, five items with lucide icons, `role="tablist"`, use Next Link routing.

## Screens
- Explore: header with SearchBar, horizontal CategoryTabs, grid/list of ExperienceCards (1 column), includes shimmer loading on first mount.
- Experience Details: image carousel placeholder, title, details, sticky bottom PrimaryButton (“Reserve”), booking modal demo with slide-up animation.
- Trips: itinerary list with cards; empty state with `.empty-state` styles if none.
- Messages: placeholder list; ensures focus styles.
- Profile: avatar, settings list; PrimaryButton (“Edit profile”).

## Accessibility
- `:focus-visible` outline using `--color-primary` and 2px offset.
- ARIA roles/labels for tabs, search, wishlist button, images with descriptive alt.
- Touch targets enforced with min-h/w 44px.

## Verification
- Visual check 390–393px width wrapper (`max-w-[393px] mx-auto`) on pages.
- Inspect elements for exact heights, radii, spacing.
- Check animations: button press scale, modal slide-up 300ms ease-out, shimmer on loading.
- Keyboard navigation: Tab through controls; outline visible and usable.

## Tasks / TODOs
- [ ] Inject tokens and classes in `globals.css` and `tailwind.config.js`.
- [ ] Create mobile components (PrimaryButton, SearchBar, CategoryTab, ExperienceCard, BottomTabs).
- [ ] Create `(mobile)` layout and routes; persist BottomTabs.
- [ ] Build Explore screen with sample data and interactions.
- [ ] Build Experience Details with modal demo.
- [ ] Build Trips, Messages, Profile screens.
- [ ] Add accessibility attributes.
- [ ] Verify against spec; refine.

## Open Questions (won’t block)
- Confirm if a custom webfont for “SajiloReserveX Cereal App” is available to embed.
- Should we remove DaisyUI usage entirely or keep alongside shadcn? (We will not rely on it.)
- Dark mode tokens not specified; we’ll keep light mode only for now.

