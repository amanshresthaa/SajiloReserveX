# Research – avoid-waitlist-bookings

> Goal: Redesign the end-to-end booking flow (app/reserve/page.tsx) with an improved UX/CX on mobile while staying within the existing design system and shadcn-style primitives.

## Repository & design context
- Stack confirmed in `AGENTS.md`: Next.js App Router + Tailwind + shadcn/ui style primitives (`AGENTS.md:11-27`).
- Design principles emphasise server-first, accessible UI, and use of Tailwind + shadcn/ui components (`AGENTS.md:120-180`).
- Booking data + venue defaults come from `lib/enums.ts` and `lib/venue.ts` (e.g., `DEFAULT_VENUE`) and are reused throughout the flow (`lib/enums.ts:1-28`, `lib/venue.ts:1-24`).

## Current booking flow implementation
- Single, very large client component `app/reserve/page.tsx` (~1,700 LOC) orchestrates the entire journey with `useReducer` state (`app/reserve/page.tsx:845-1685`).
- Inline "shadcn-like" components (Button, Input, Card, etc.) are re-declared locally instead of importing from a shared UI package (`app/reserve/page.tsx:415-532`).
- Steps managed via `state.step` with four major views:
  1. Step 1 – slot selection: choose date, time, party size, optional seating/notes (`app/reserve/page.tsx:845-1063`).
  2. Step 2 – guest details, remember-me, terms acceptance, marketing opt-in (`app/reserve/page.tsx:1064-1237`).
  3. Step 3 – review & confirm with summary list and CTA (`app/reserve/page.tsx:1394-1486`).
  4. Step 4 – confirmation vs manage bookings (toggle based on `mode`) plus cancellation dialog (`app/reserve/page.tsx:1331-1680`).
- Local storage caches contact details when “remember details” is checked (`app/reserve/page.tsx:1519-1563`).
- URL query `?view=manage` forces manage view via `forceManageView` flag (`app/reserve/page.tsx:1331-1389`).
- Analytics events sent on date/time selection, detail submission, and booking confirmation through `track()` helper (`lib/analytics.ts:1-40`, used throughout Step1-3).
- API interaction: `POST /api/bookings` for create/update, `GET /api/bookings` for lookup, `DELETE /api/bookings/[id]` for cancellation; on success, Step 4 summarises booking and waitlist states (`app/reserve/page.tsx:1565-1674`, `app/api/bookings/route.ts:1-220`).

## Visual & UX observations
- Screen width capped at `max-w-2xl` or `max-w-3xl`, but no explicit mobile-first layouts beyond simple grid adjustments (`app/reserve/page.tsx:878-920`, `app/reserve/page.tsx:1415-1459`).
- Progression lacks a visible step indicator; users rely on headings alone. Potential cognitive load when returning/backtracking.
- Time-slot grid defaults to 3 columns on very narrow screens (`grid grid-cols-3`) which can create cramped tappable targets on small mobile widths (`app/reserve/page.tsx:912-920`).
- “Additional options” tucked inside native `<details>` element. On Safari iOS the default affordance is subtle and may not match the rest of the shadcn system.
- Step 2 surfaces four stacked checkboxes with dense text blocks that read heavy on mobile (terms, remember, marketing). Minimal spacing between sections may increase friction (`app/reserve/page.tsx:1114-1183`).
- Review step (Step 3) duplicates info but lacks hierarchy (every row same weight). Primary CTA sits adjacent to "Back" with same visual weight due to button variants (`app/reserve/page.tsx:1436-1486`).
- Confirmation view mixes summary content and manage-bookings CTA; toggling between modes relies on text buttons without structural cues (`app/reserve/page.tsx:1331-1392`).
- Custom `AlertDialog` lacks motion/aria attributes, potentially harming accessibility when cancelling bookings (`app/reserve/page.tsx:520-537`).

## Mobile-specific friction
- Slot buttons sized via default padding; when 3 per row the hit area may drop below recommended 44px height/width on narrow devices. No sticky footer CTA, so users must scroll to continue after long slot lists.
- Step 2 checkboxes + legal copy can push CTAs far below the fold, requiring extra scrolling before “Review booking” button appears.
- Manage bookings table uses flex row layout that collapses to vertical stacks; cancellation/edit buttons become small inline buttons, possibly challenging for touch (`app/reserve/page.tsx:1589-1645`).
- Confirmation summary lacks quick access to saved pass (no calendar add, no share) – potential enhancement area if allowed by existing components.

## Data & waitlist handling
- POST normalises booking type based on slot, falls back to waitlist if `findAvailableTable` fails (`app/api/bookings/route.ts:78-214`).
- Response may include flags `waitlisted` or `allocationPending`, which the UI surfaces through headings/icons (`app/reserve/page.tsx:1206-1360`).
- Waitlist state conveys with icon color only (amber/sky). No inline guidance on next actions beyond copy; we can clarify in redesign.

## Existing component constraints
- Despite alias `@/components/ui`, there is no shared UI directory in repo; booking page re-implements shadcn primitives locally. Any redesign must reuse these existing declarations or relocate them to shared modules without inventing new component APIs (per user instruction).
- `lib/utils.ts` exports canonical `cn()` helper (`lib/utils.ts:1-6`).
- Icons defined inline mimic lucide icons – we should reuse them instead of introducing new glyph sets (`app/reserve/page.tsx:14-206`).

## Opportunity areas for redesign
- Introduce a compact stepper/progress indicator using existing elements (e.g., Buttons, Labels, `div`s) for clarity.
- Rebalance layout for mobile: single-column flows, sticky or floating CTA, larger slot chips, reorganise optional settings into modal/sheet (if available) or reposition below main CTA.
- Simplify Step 2 legal copy with accordions/tooltips (must verify available components) or restructure text hierarchy (bold headings, secondary text).
- Clarify waitlist outcomes with distinct panels or status banners anchored at top of confirmation view.
- Consider extracting shared primitives into `components/reserve` while still using existing definitions to reduce duplication—subject to “no new components” constraint (may just reorganise JSX).

## Known unknowns / risks
- Lack of central shadcn UI directory means importing canonical components may require creating files (disallowed). Need to confirm whether moving inline definitions to shared folder counts as “introducing new components.”
- No current metrics or feedback to prioritise micro-interactions; improvements must rely on heuristics and best practices.
- Need to ensure any layout updates remain consistent with DaisyUI usage elsewhere (signin page still uses Daisy classes). Potential theme clash if we deviate too far from tailwind tokens.
