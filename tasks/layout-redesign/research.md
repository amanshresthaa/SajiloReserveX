# Research

## Existing layout overview

- `app/layout.tsx` defines a simple `<body>` with a skip link, wraps children in `ClientLayout` and `AppProviders`.
- `app/page.tsx` implements the home page hero with header (simple nav), CTA buttons, and feature grid.
- Styling relies heavily on Tailwind utility classes and theme tokens defined in `app/globals.css`.
- Typography currently uses standard tailwind sizes; hierarchy is limited to hero header and small uppercase label.
- Layout is container-based with `mx-auto` and `px-6`; lacks responsive variations for large screens and multi-column structure beyond hero.
- Background is plain `bg-background`; feature cards use `bg-card/80` with border.

## Design constraints & assets

- Design tokens already defined in `globals.css` (colors, radii, shadows, spacing) can be leveraged.
- Buttons use `buttonVariants` from `@/components/ui/button`; a `ButtonSignin` component handles auth CTA.
- There is no dark mode handling on the home page; existing tokens support it, so ensure design is theme-friendly.
- Need to keep skip link and accessibility features.

## Opportunities for redesign

- Introduce structured layout with hero, metrics, product imagery placeholder, feature sections, testimonials, and footer.
- Improve header with translucent background, bordered container, and nav arrangement.
- Expand global styles to include new background patterns, container padding adjustments, and custom components.
- Add responsive grid for hero (text + card/preview) and sections that adapt from single column on mobile to multi-column on desktop.
- Use consistent spacing scale (e.g., clamp) to handle large screens gracefully.
