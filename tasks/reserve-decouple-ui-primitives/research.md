# Research – reserve decouple ui primitives

- Wizard components imported design-system primitives from `@/components/ui/*`, tying the SPA bundle to the Next.js app.
- Required primitives: alert, badge, button, calendar, card, checkbox, form, input, label, popover, progress, separator, textarea, toggle, toggle-group, tooltip.
- Existing implementations live under `components/ui`, mostly Shadcn-inspired with minimal external deps besides Radix packages already available in the monorepo.
- Goal: clone these primitives into `reserve/shared/ui` and adjust imports to rely solely on SPA-local paths.
