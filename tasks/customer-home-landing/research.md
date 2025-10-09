# Research: Customer Home & Navbar Refresh

## Existing Patterns

- **Global customer navbar** (`components/customer/navigation/CustomerNavbar.tsx:1`)
  - Client component that renders site logo, session-aware actions, and a mobile sheet.
  - Depends on Supabase hooks (`useSupabaseSession`, `useProfile`) for authentication context.
  - Uses shadcn/ui primitives (`DropdownMenu`, `Sheet`, `Avatar`) alongside lucide icons.
  - Current implementation is monolithic (~220 LOC) with intertwined desktop/mobile logic and direct toast notifications on sign out.
  - Tested via `reserve/tests/unit/CustomerNavbar.test.tsx` for loading/authenticated states.
- **Home page** (`app/page.tsx:1`)
  - Server component fetching restaurants via `listRestaurants` and hydrating React Query cache for `RestaurantBrowser`.
  - Hero content + marketing CTA component (`MarketingSessionActions`) followed by `RestaurantBrowser` list.
  - Layout uses Tailwind utility classes; structure is linear without modular subcomponents.
- **Restaurant listing** (`components/marketing/RestaurantBrowser.tsx:17`)
  - Provides filtering, analytics, skeleton/error states; expects `initialData` and `initialError` props.
  - Already production-ready; homepage can continue delegating listing UI to this component.
- **Layout with navbar** (`components/LayoutClient.tsx:12`)
  - Renders `<CustomerNavbar />` globally before route content. Any redesign must remain compatible with client rendering and skip-link expectations.

## External References & Constraints

- SHADCN UI components are preferred for new UI (per Context Engineering Framework). Existing navbar already leverages them, so redesign should stay within that system.
- Supabase session hooks require the component to remain client-side. Encapsulate auth logic cleanly to preserve hydration safety.
- Accessibility standards: maintain skip links, keyboard navigation, proper `aria` attributes, focus management, compliant touch targets.
- Performance: keep navbar lightweight (avoid unnecessary state) and ensure home page remains fast (lazy animation, minimal blocking content).

## Opportunities & Considerations

- **Navbar**
  - Split desktop and mobile sections into smaller React components or utility functions to improve readability.
  - Introduce a semantic `<nav>` element, consistent focus rings, and reduce inline effect thrash.
  - Use derived booleans and `useMemo` to simplify conditional markup; isolate sign-out flow to separate hook/function.
- **Home page**
  - Extract hero/feature sections into dedicated components within `app/page.tsx` for clarity.
  - Consider adding supporting sections (e.g., value props, testimonials) only if time permits; primary goal is a clean, customer-focused landing with restaurant list.
  - Ensure loading/error states from `RestaurantBrowser` remain discoverable; provide context text near the list.
- **Testing**
  - Existing Vitest snapshots rely on navbar markup; redesign will require updated expectations.
  - Home page is server-rendered; unit tests may not exist, but consider adding integration coverage for hero sections if necessary.

## Open Questions

1. Should the landing page include additional marketing sections (testimonials, FAQs), or strictly hero + restaurant list?
2. Are there brand assets (logo SVG, colors) we should incorporate instead of the current `SRX` badge?
3. Any analytics events needed for the new hero CTA interactions beyond those already emitted by `MarketingSessionActions` / `RestaurantBrowser`?
