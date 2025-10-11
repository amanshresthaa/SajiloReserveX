# Research: Remove Sticky Ops Header

## Existing Patterns

- `components/ops/OpsAppShell.tsx` renders the sticky header with the markup the user wants removed.
- No other components define a similar `<header className="sticky …">` structure; `rg '<header className="sticky'` matched only this file.
- The global `CustomerNavbar` (`components/customer/navigation/CustomerNavbar.tsx`) wraps its markup in `<div className="relative sticky top-0 z-50">`, matching the second snippet; it is mounted for every route through `ClientLayout`.
- Navigation controls already live inside the `AppSidebar` component, so removing the header should not break access to the sidebar trigger.

## External Resources

- None required; all logic is internal to the repo.

## Technical Constraints

- `OpsAppShell` is a client component that wraps all `/ops` routes, so changes here affect every Ops page.
- The sidebar trigger must remain accessible so users can still toggle the sidebar without the header container.
- Layout needs to keep `Skip to content` accessibility link functional.

## Open Questions

- After removing the header, should any of its child elements (title, button) be relocated elsewhere? Assuming removal means deleting the entire block.

## Recommendations

- Remove the `<header>` block entirely and allow the inset content to start directly after the skip link.
- Keep the `New walk-in booking` button logic if it needs to exist elsewhere; otherwise remove alongside the header to avoid unused JSX.
- Verify resulting layout spacing; may need to adjust padding on the main content container once header padding disappears.
- Condition the global `CustomerNavbar` so `/ops` routes do not render it, preventing the sticky customer header from appearing in Ops contexts while preserving it for customer-facing pages.
