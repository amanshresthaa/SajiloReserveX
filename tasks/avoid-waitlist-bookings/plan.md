# Plan - avoid-waitlist-bookings

## 1. Guardrails and prerequisites
- Limit edits to `app/reserve/page.tsx`; reuse the inline shadcn-like primitives and icon set already defined there so we honour the "no new components" rule.
- Preserve reducer state, analytics events, API interactions, and local storage behaviour that already power create/update/manage paths.
- Keep a mobile-first mindset (target ~390px width). Ensure primary controls remain at least 44px tall/wide and accessible.

## 2. Shell layout updates (BookingFlowContent)
- Inject a lightweight step indicator (rendered inline, not exported) that lists steps and highlights current/completed states using existing Button/Label styles.
- Wrap the step content in a consistent flex column with neutral background and spacing so each step feels connected while keeping the existing Suspense fallback.

## 3. Step 1 - availability selection
- Reorder content to show a compact summary header (selected date, time, party) before inputs and clarify the next action with short helper copy.
- Replace the 3-column time grid with a horizontally scrollable chip list (`overflow-x-auto`, `flex gap-2`, `min-w-[88px]`) so mobile taps are larger.
- Promote party size and booking type selection into clearly labelled button clusters rather than the current select+checkbox combo; ensure state updates still dispatch through the reducer.
- Keep optional seating/notes in an accordion but tighten spacing, lighten helper text, and emphasise that the section is optional.
- Make the Continue CTA persist via a sticky CardFooter on small screens while maintaining existing analytics call on continue.

## 4. Step 2 - guest details
- Group inputs into two clear blocks: contact fields (name/email/phone) and preferences (remember details, terms, marketing). Use subtle borders/backgrounds instead of dense paragraphs.
- Surface terms acknowledgement inside a highlighted container with inline validation so users understand the requirement without scrolling.
- Keep the Review button visible via a sticky footer similar to Step 1; retain the Back control nearby for quick edits.

## 5. Step 3 - review and confirm
- Convert the review list into a definition list style grid with stronger headings for key facts (date/time/party).
- Add a status banner space that can show pending allocation or waitlist warnings before the details list.
- Stack the primary confirm CTA (full width on mobile) above a secondary back action to reduce accidental taps.

## 6. Step 4 - confirmation and manage bookings
- Reframe the confirmation card into two stacked sections: (a) status banner with icon + copy and (b) booking recap with venue information.
- Render the summary/manage switch as a pill segmented control built from Buttons so the two modes are discoverable.
- Restructure manage list items into card-like blocks with larger edit/cancel buttons that span full width on mobile while keeping existing event handlers.
- Improve the inline AlertDialog accessibility with `role="dialog"`, aria labels, and focus trapping behaviour while staying inside the existing component definition.

## 7. Logic and state adjustments
- Reuse the current reducer shape; add only minimal booleans (e.g. for accordion open state) if absolutely necessary and initialise them properly.
- Ensure analytics (`track`) still fire on the same user events after restructuring the JSX.

## 8. Styling and polish
- Use Tailwind tokens already available in `app/globals.css`; avoid ad-hoc hex values.
- Double check typography hierarchy (headings `text-2xl+`, body copy `text-sm text-slate-600`) and spacing consistency across steps.

## 9. Verification
- Manual QA: run through new booking, waitlist scenario (force no table by selecting busy slot), manage flow (lookup, edit, cancel) and confirm remembered details persist.
- Automated: run `pnpm lint` (and `pnpm test` if it exists) to catch regressions.
