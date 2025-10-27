# Research: Missing Switch Component

## Existing Patterns & Reuse

- `TableInventoryClient` expects a Shadcn-powered `Switch` at `@/components/ui/switch`, but that file does not exist.
- Repo already uses Shadcn UI components (`badge`, `dropdown-menu`, `input`, etc.) driven by `components.json`.
- No custom switch-style toggle exists under `src/components/ui/` or `components/ui/`; only unrelated `components/team-switcher.tsx`.

## External Resources

- [Shadcn UI Switch docs](https://ui.shadcn.com/docs/components/switch) – canonical implementation we should import via Shadcn CLI/MCP.

## Constraints & Risks

- Missing component blocks Next.js build.

## Open Questions (and answers if resolved)

- Q: Does the project already include a switch component via Shadcn?
  A: No. `rg --files -g 'switch.tsx'` returned no UI components, so we must add it.

## Recommended Direction (with rationale)

- Use Shadcn MCP/CLI (`npx shadcn@latest add @shadcn/switch`) to generate the missing `Switch` component under `@/components/ui/switch`, aligning with existing UI patterns and avoiding custom code.
- Re-run the build to ensure resolution succeeds once the component exists.
