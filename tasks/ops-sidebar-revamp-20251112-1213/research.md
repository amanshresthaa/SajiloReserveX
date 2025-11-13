---
task: ops-sidebar-revamp
timestamp_utc: 2025-11-12T12:13:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Research: Ops sidebar rebuild

## Requirements

- Functional:
  - Rebuild the /ops navigation sidebar from scratch using the latest Shadcn sidebar primitives while keeping the same navigation sections, account area, restaurant switcher, and support entry.
  - Provide reliable toggle behavior across desktop and mobile, ensuring the new shell works without glitches.
  - Maintain cookie-based persistence of open/collapsed state (or equivalent durable UX) so server-rendered layout can hydrate with the correct default.
- Non-functional:
  - Follow existing accessibility guarantees: keyboard navigable, focus-visible states, aria labeling.
  - Keep bundle lean; avoid unnecessary dependencies.
  - Ensure styling aligns with current design tokens (Tailwind classes) and adapts to light/dark themes.

## Existing Patterns & Reuse

- Current implementation lives in `src/components/features/ops-shell/` (`OpsShell`, `OpsSidebar`, `OpsSidebarTrigger`, `navigation.tsx`).
- Base Shadcn implementation already exists in `components/ui/sidebar.tsx`, but it has grown complex; we can refactor/strip unused variants while keeping core interactions.
- `OPS_NAV_SECTIONS` exports the nav configuration (icons, flags) that we will keep as-is.

## External Resources

- [Shadcn Sidebar Pattern](https://ui.shadcn.com/blocks/sidebar) — reference markup and CSS tokens for the latest recommended structure.
- [ARIA Navigation Guidelines](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation/) — ensure the rebuilt nav exposes correct landmarks and current-page semantics.

## Constraints & Risks

- Must avoid regressions to routing links or feature-flag gating logic.
- Restaurant switcher and sign-out logic rely on existing contexts (`useOpsSession`, `signOutFromSupabase`); the rebuild must keep them functional.
- Need to confirm whether the cookie contract `sidebar_state` is still required by other components; if yes, the new implementation must read/write it.
- Extensive CSS changes could affect layout widths/responsiveness; need to validate on multiple breakpoints.

## Open Questions (owner, due)

- Q: Is the existing `components/ui/sidebar.tsx` acceptable to simplify, or should we replace it entirely with a leaner custom component? (owner: github:@assistant, due before implementation) — leaning toward pruning to essentials while keeping API to limit churn.
- Q: Any animation or motion preferences for collapse/expand? (Not specified; default to subtle transitions.)

## Recommended Direction (with rationale)

- Create a new `OpsSidebarLayout` module that encapsulates provider, sidebar, inset, and header in a single cohesive component with a streamlined API. This reduces the surface area vs. juggling provider + shell + trigger.
- Rebuild the visual structure by re-authoring the markup with semantic sections (nav/aside/footer), customizing Tailwind classes for clarity instead of stacking multiple utility variants.
- Keep configuration-driven nav rendering but move helper functions and types into a dedicated `navigation.ts` to avoid duplication.
- Preserve the cookie persistence by extracting a small hook (`useSidebarPreference`) that syncs provider state with `document.cookie`.
- After rebuilding, remove obsolete code paths (e.g., old wrappers) to reduce bundle size and future bugs.
