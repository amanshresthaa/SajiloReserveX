# Research: Ops Sidebar Navigation

## Existing Patterns

- `/ops` pages currently render standalone `<main>` elements with route-specific spacing (`mx-auto`, `max-w-5xl`) and no shared shell.
- Authenticated operations routes live under `app/(ops)/ops/(app)/*`; public login goes through `app/(ops)/ops/(public)/login`, so a sidebar layout should scope to the `(app)` group only.
- Tailwind tokens for sidebar theming already exist in `app/globals.css` (`--sidebar-*` variables mapped to `--color-sidebar-*`).
- Ops components (`components/ops/...`) import UI primitives from `components/ui/*` (all shadcn-based), so extending the design system with `components/ui/sidebar.tsx` is consistent with the codebase.

## External Resources

- shadcn/ui Sidebar component docs (provided snippet) — defines `SidebarProvider`, structural primitives, accessibility expectations, and styling conventions.
- WAI-ARIA Authoring Practices for navigation landmarks (for keyboard support and focus management).

## Technical Constraints

- App Router layouts are Server Components by default; the shadcn sidebar provider is client-side, so we need a client wrapper (e.g., `OpsAppShell`) rendered from a server layout.
- Sidebar state persistence uses cookies; ensure we only access `document.cookie` client-side.
- /ops routes depend on Supabase auth and must keep redirects intact; layout changes must not break server-side redirects already in each page.

## Recommendations

- Install shadcn `sidebar` primitive via CLI to stay aligned with existing component sourcing and ensure future updates pull cleanly.
- Create a reusable `AppSidebar` tailored to operations navigation (dashboard, walk-ins, team) with lucide icons and active state styling.
- Introduce a shared `(app)` layout that wraps children in `SidebarProvider`, renders the sidebar, and presents a responsive header containing `SidebarTrigger`, breadcrumbs/title slot, and account actions placeholder.
- Update existing pages to avoid nested `<main>` elements (let the layout own the landmark).
- Add verification covering desktop + mobile collapse behaviour, keyboard toggling, and auth redirects remaining functional.
