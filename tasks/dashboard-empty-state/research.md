# Dashboard Empty State — Research

## Task Outline & Subtasks

- Review current dashboard table implementation to understand existing empty state placeholder.
- Identify analytics utilities to emit `dashboard_empty_state_viewed` event.
- Determine best structure for reusable empty state component per Story C2 (friendly messaging + CTA to `/reserve`).

## Findings

- `components/dashboard/BookingsTable.tsx` currently includes inline empty-state markup without analytics. Story C2 calls for standalone `EmptyState` component and tracking.
- No analytics emitter exists yet; sprint doc mentions `lib/analytics/emit.ts` planned in Epic E1 (not implemented). Need to add minimal emitter now.
- Empty state should emit analytics event once per view (on mount) using `useEffect` with guard to avoid double fires during React Strict Mode (wrap with `useRef`).
- CTA should remain accessible button/link, ideally reusing shadcn `Button` component with `asChild` now that we can import proper version or keep `Link` styled; confirm `Button` supports `asChild` (our UI button likely extends shadcn base with `forwardRef`—check implementation).
- Import path for `Button`: `components/ui/button.tsx`. Inspect to ensure `asChild` support (shadcn default does).

## Considerations & Risks

- Ensure analytics emitter is resilient (console log in dev, no failures). Should support optional payload (like `{}`) and hashed user context? For now just send name + timestamp.
- Avoid multiple events on re-renders: use effect with `didReport` ref.
- Keep component accessible with descriptive text and `<section role="status">` or similar? Minimal requirement is descriptive text with CTA.

## Open Questions

- None; proceed with component extraction and analytics helper.
