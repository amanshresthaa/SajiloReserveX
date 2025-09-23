# Verification Checklist

- Build succeeded: `npm run build` ✓
- Routes available:
  - Explore: /explore (header, SearchBar 52px, CategoryTabs, ExperienceCards with 16px radius + card shadow)
  - Experience Details: /experience/[id] (hero image, details, sticky PrimaryButton, modal slide-up 300ms)
  - Wishlists: /wishlists (empty state)
  - Trips: /trips (empty state)
  - Messages: /messages (list items with focus-visible)
  - Profile: /profile (avatar, settings, PrimaryButton)
- Bottom tabs: visible and fixed at bottom (height 83px, safe-area padding), active tab color #FF385C ✓
- Tokens applied:
  - Colors: primary #FF385C, pressed #E01D45, accent #00A699, surfaces, border #DDDDDD ✓
  - Radii: sm 8px, md 12px, lg 16px via utilities ✓
  - Spacing: 8px grid via Tailwind defaults + constants for screen/card ✓
  - Shadows: card, header, modal CSS vars used ✓
  - Typography: utility classes mapped (screen-title, section-header, card-title, body, label, button) ✓
- Animations:
  - Button press scale 0.98 via `.button-press` and shadcn button active state ✓
  - Modal slide-up via `.modal-enter` ✓
  - Shimmer via `.loading::after` ✓
- Accessibility:
  - Focus-visible outlines in primary color ✓
  - ARIA roles: tablist/tabs on BottomTabs & CategoryTab; role=search on SearchBar; alt on images; aria-labels on wishlist/primary actions ✓
- Touch targets: min 44px on buttons/tabs ✓

Manual test notes:
- In a 390–393px viewport, layout stays single-column with 24px screen margins and 16px card gaps.
- Button height is 48px; SearchBar is 52px; CategoryTabs show underline for active.

Open items:
- Embedded font for “SajiloReserveX Cereal App” not included; using fallback family. Provide font to embed for pixel-perfect typography.
- DaisyUI remains in project but not used by the new mobile UI.
