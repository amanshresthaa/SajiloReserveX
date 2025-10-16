# Research: Fix Shadcn Imports Missing In Capacity UI

## Existing Patterns & Reuse

- The repository already houses Shadcn-style primitives in `components/ui/` (e.g., `button.tsx`, `dialog.tsx`, `input.tsx`) that mirror the [ui.shadcn.com](https://ui.shadcn.com) implementations.
- `tsconfig.json` maps `@/components/*` to both `./components/*` and `./src/components/*`, so adding new primitives under `components/ui/` keeps consistency with the existing imports.
- Toast notifications today rely on `react-hot-toast` via `components/LayoutClient.tsx`, but there is no shared wrapper hook or Shadcn `toast` primitives checked into the repo.

## External Resources

- [Shadcn UI Select](https://ui.shadcn.com/docs/components/select) – canonical Radix-based select implementation.
- [Shadcn UI Table](https://ui.shadcn.com/docs/components/table) – table markup utilities.
- [Shadcn UI Toast](https://ui.shadcn.com/docs/components/toast) – toast primitives + `use-toast` helper.

## Constraints & Risks

- Introducing the toast primitives must coexist with the existing `react-hot-toast` usage; replacing it entirely might regress other surfaces unless carefully coordinated.
- Missing `Select`, `Table`, and `useToast` currently block the build; partial implementation risks runtime issues if APIs diverge from Shadcn expectations.
- Need to ensure CSS tokens/utilities referenced by Shadcn components (e.g., `cn` helper, `@radix-ui` dependencies) are already present in the project; otherwise, we may need to install additional packages.

## Open Questions (and answers if resolved)

- Q: Can we rely on Shadcn toast primitives without breaking the existing `react-hot-toast` setup?
  A: Likely yes by scoping Shadcn to the ops dashboard context and rendering its `Toaster` alongside the existing global toaster, but we should evaluate whether to migrate or to wrap `react-hot-toast` instead.
- Q: Are Radix UI dependencies already installed?
  A: Existing Shadcn components (e.g., `dialog`, `popover`) imply Radix packages are available; will confirm during implementation.

## Recommended Direction (with rationale)

- Add the missing Shadcn primitives (`components/ui/select.tsx`, `components/ui/table.tsx`) and `hooks/use-toast.ts` (plus supporting `components/ui/toast.tsx` if absent) following the canonical implementations so existing imports resolve without further refactors.
- Render the Shadcn `Toaster` near `components/LayoutClient.tsx` or a scoped provider to ensure `toast()` calls succeed where used. This keeps consistency with other Shadcn components and avoids rewriting feature code.
