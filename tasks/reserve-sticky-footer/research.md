# Research – reserve-sticky-footer

> Goal: Modularise the `/reserve` booking flow and replace the large inline progress tracker with a compact, bottom-sticky experience (hidden until triggered) that reflects the attached references while honouring design principles: subtle haptics, clear space/typography hierarchy, and micro-speed animations.

## Repository + design context
- Stack confirmed via `AGENTS.md`: Next.js App Router + Tailwind + shadcn-style primitives with emphasis on accessible, server-first UI (`agents.md`).
- Core design tenets (subtle haptics, typography spacing, quick animations) are reiterated in user instructions and should influence any new component behaviour (e.g., vibration hooks, transition durations).
- Shared helpers exist in `lib` (`lib/utils.ts` exposes canonical `cn`, analytics tracker in `lib/analytics.ts`), but `/reserve` currently duplicates several utilities instead of importing them.

## Current `/reserve` implementation
- `app/reserve/page.tsx` is a single 2k+ LOC client component that redefines icons, UI primitives (Button, Card, Inputs), reducer, and four step views in one file.
- Inline step indicator sits at the top of the page inside the hero card (`app/reserve/page.tsx:2071-2126`). It renders a full list of steps with borders/backgrounds; no modular abstraction.
- Each step (`Step1`…`ConfirmationStep`) relies on sticky `CardFooter` sections for CTAs (`app/reserve/page.tsx:1014-1020`, `1218-1231`, `1487-1510`).
- Reusable bits like `Field`, `SummaryRow`, `AlertDialog` are declared inline around `app/reserve/page.tsx:532-846`, limiting reusability.
- State is managed through `useReducer` (`app/reserve/page.tsx:617-736`) with helper utils `U.*` for formatting, slot generation, and localStorage hydration (`app/reserve/page.tsx:270-415`, `1833-1861`).
- Analytics events fire via `track()` on key interactions (date/time selection, details submit, confirmation) (`lib/analytics.ts`, calls throughout Step1-3).

## Existing patterns relevant to modularisation & triggers
- There is an empty `components/reserve/` directory; ideal destination for extracted primitives and step modules.
- Repo already uses simple Tailwind-based component wrappers (`components/ButtonLead.tsx`, `components/LayoutClient.tsx`)—pattern supports moving shared JSX into dedicated files rather than re-declaring within pages.
- For scroll-based triggers, `components/FeaturesListicle.tsx` demonstrates `IntersectionObserver` to react when an element exits the viewport (`components/FeaturesListicle.tsx:416-454`), a pattern we can adapt for showing/hiding the sticky progress bar.
- No existing haptics helper; we'll likely introduce a guarded `useHapticFeedback` hook leveraging `navigator.vibrate` with small durations.
- Animations currently rely on Tailwind `transition` utilities; no framer-motion dependency, so micro animations should use CSS transitions/opacity transforms for consistency.

## UX behaviour to preserve
- Step transitions update `state.step` and maintain local analytics; new progress component must stay in sync with `step` state.
- Local storage “remember contacts” logic updates within `useEffect` when the checkbox changes (`app/reserve/page.tsx:1833-1861`); modularisation should not break this lifecycle.
- Confirmation flow depends on `stepsMeta` metadata (`app/reserve/page.tsx:1761-1770`)—moving this into a shared module will keep step labels consistent between header and new bottom bar.

## Observed issues/opportunities
- Inline `U.cn` duplicates the shared `cn` helper; extracting to shared module reduces drift.
- Progress indicator currently occupies vertical space and cannot be hidden; we can convert it into a bottom “progress pill” that slides in once the user moves past Step 1 header or when a step change occurs.
- CTA footers already sticky; new design should avoid double-stickiness by coordinating layout (e.g., offset bottom bar height).
- Step modules can be moved into `components/reserve` to shrink the page file and improve testability (each can accept props and dispatch callbacks).
- Accessibility: new sticky bar must respect focus order, provide role/status updates (e.g., `aria-live=polite`), and remain keyboard reachable.

## Open questions / considerations
- Trigger condition: likely when the hero summary scrolls off-screen OR when step > 1; repo has no direct scroll hook, so IntersectionObserver is the closest reference. Need to ensure server-side rendering handles observer creation safely (guard for `window`).
- Haptics: should fire on significant actions (step advance) but remain optional—guard behind feature detection and user agent conditions.
- Need to confirm how to manage layout overlap with existing sticky footers; may require bottom padding on main content when progress bar visible.

These points will guide the planning phase—focus on extracting shared pieces, implementing a bottom sticky progress preview with scroll/step triggers, and layering in subtle transitions + haptics while keeping analytics/state untouched.
