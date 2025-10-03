# Research Notes

## Observed Repo State

- `app/page.tsx` uses Tailwind utility tokens such as `bg-background`, `text-primary`, `container`, `flex`, and CTA buttons rely on `buttonVariants` from `components/ui/button.tsx` (`bg-primary`, `text-primary-foreground`, etc.).
- `components/ui/button.tsx` (`components/ui/button.tsx:1`) expects Tailwind color tokens `primary`, `secondary`, `accent`, etc. to exist and map to CSS variables following the standard shadcn/ui setup.
- `app/layout.tsx` (`app/layout.tsx:17`) attaches `font-sans` and `bg-background` on the root/body, so the whole app depends on Tailwind theme tokens being generated correctly.

## Tailwind / Global Styles

- Active global stylesheet (`app/globals.css`) defines many CSS custom properties inside `:root`/`.dark`, and sets up reset/accessibility rules, but **does not include any `@theme` definitions** binding Tailwind tokens (e.g. `--color-primary`) to those variables.
- Legacy backup file (`app/globals.css.backup-20251003-163824`) still contains the previous `@theme inline { ... }` block that mapped the CSS variables to Tailwind color keys (`--color-primary`, `--color-background`, etc.) and imported `tw-animate-css` plus `@custom-variant dark`—confirming that the mapping step was removed during the rewrite.
- `tailwind.config.js` currently only exposes custom color names prefixed with `sr-...` but no plain `primary`, `background`, `muted`, etc. tokens, so utilities like `bg-primary` or `text-muted-foreground` have no generated styles unless we restore the theme mapping.

## Hypothesis

- Because the new `globals.css` dropped the `@theme inline` block (and Tailwind config no longer declares those colors), Tailwind no longer generates utilities for `bg-background`, `text-primary`, `bg-card`, etc. Almost every component relies on those tokens, so the compiled CSS is essentially empty for them, leaving the page unstyled.
- Restoring the token bridge—either by reintroducing the `@theme inline` block or by defining equivalent colors in `tailwind.config.js`—should bring back the styling. We should align with shadcn’s standard approach to stay consistent with the rest of the codebase.

## Open Questions / Next Steps

- Decide whether to restore the `@theme inline` block (preferred—matches prior setup and avoids touching many components) or redefine colors directly in `tailwind.config.js`.
- Verify if other parts (e.g. animations from `tw-animate-css`, `@custom-variant dark`) are still needed after the migration.
