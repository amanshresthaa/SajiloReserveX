# Research: Guest Information

## Existing implementation
- `components/reserve/steps/DetailsStep.tsx` renders the guest details form using shadcn `Card`, `Input`, `Checkbox`, and the shared `Field` wrapper. It validates inputs inline (length check for name, regex-based email/phone) and blocks progression to the review step until `agree` (terms checkbox) is checked.
- `bookingHelpers.isEmail` and `bookingHelpers.isUKPhone` provide validation logic. The phone validator enforces UK mobile formats (`+44/44/0` prefix), so non-UK numbers currently fail.
- Terms opt-in and marketing preference toggles live here; continuing dispatches `SET_STEP` to 3 with analytics via `track("details_submit", ...)`.
- `components/reserve/booking-flow/index.tsx` hydrates persisted contact details from `localStorage` (`storageKeys.contacts`) on mount and re-saves when `rememberDetails` is true, using the reducer action `HYDRATE_CONTACTS` to populate state safely.
- The reducer (`state.ts`) stores `name`, `email`, `phone`, `agree`, `rememberDetails`, `marketingOptIn`, and ensures they carry through to confirmation screens.

## Backend contract alignment
- `/app/api/bookings/route.ts` and `/app/api/bookings/[id]/route.ts` both require `name`, `email`, `phone`, and `marketingOptIn` (optional boolean). Emails are normalized server-side; phone numbers are trimmed but not normalized beyond whitespace removal.
- Supabase schema (`current.sql`) enforces `customers.email` lowercase and `customers.phone_normalized` length constraints; the server performs normalization in `server/customers.ts` (e.g., `normalizeEmail`, `normalizePhone`). Ensuring we honor the same patterns prevents unhandled validation errors.

## Accessibility + UX patterns
- Error messages render in-line beneath each field with iconography (lucide AlertCircle) and descriptive text, aligning with `agents.md` requirements (inline errors, no blocking paste, accessible labels via `Label`).
- `Checkbox` controls are wrapped in `<label>` to create a larger hit target; marketing/remember toggles attach helper text to satisfy "Inline help first" guidance.
- There is no focus management beyond default browser behaviour; moving to review step will need to ensure focus is placed appropriately (e.g., on the card heading or first error if validation fails) per the accessibility rules.

## Verification
1. Inspected `DetailsStep.tsx` to confirm validations, analytics hooks, and `onActionsChange` output (Back + Review actions) for the sticky footer.
2. Cross-referenced API schemas and Supabase constraints to ensure captured fields align with server expectations.
3. Reviewed reducer hydration logic to understand persistence side effects and privacy implications (rememberDetails opt-in).

## Risks & open questions
- Phone validation is UK-specific; internationalization may be required if booking spans multiple venues. Plan should consider toggles or dynamic validation based on venue.
- There is no explicit focus trap/return on step transitions. We'll need to add when polishing for agent-driven navigation.
- Error surfaced from server (e.g., double-booking) appears later during confirmation (`state.error` in ReviewStep). Need to ensure guest info step communicates server validation problems if we move checks earlier.
