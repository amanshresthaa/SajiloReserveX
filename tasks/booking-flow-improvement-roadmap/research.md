# Research – Booking Flow Improvement Roadmap

## Scope & Inputs
- Focused on reservation flow files under `components/reserve/` and supporting analytics/helpers per user brief.
- Verified color contrast claims via custom Node luminance script (see below) and cross-checked Apple/Material touch target guidance (historical knowledge, HIG 2023 & Material 3).
- No existing design token system beyond Tailwind defaults (`tailwind.config.js` minimal) and bespoke UI primitives.

## Existing Patterns & Constraints
- **Layout shell** uses a centered column inside `max-w-3xl` container for both main content and sticky progress overlay (`components/reserve/booking-flow/index.tsx:398`, `components/reserve/booking-flow/sticky-progress.tsx:28`). No `md`, `lg`, `xl` breakpoints applied anywhere in the flow.
- **Cards & forms** share consistent padding (`p-6`, `p-4`) via `Card` primitives. Most steps wrap content in `Card` with `max-w-3xl` even though parent already constrained, leading to nested width caps (`components/reserve/steps/ReviewStep.tsx:72`).
- **Typography**: headings around `text-2xl`/`text-3xl`, but supporting copy frequently `text-sm` (e.g., `PlanStep` helper copy, `ConfirmationStep` description lines). Default input and button text set to `text-sm` in primitives (`components/reserve/ui-primitives.tsx:12`, `components/reserve/ui-primitives.tsx:31`).
- **Touch targets**: Default button height `h-10` (40px) and checkbox size `h-4 w-4` (16px) with no additional hit area wrappers (`components/reserve/ui-primitives.tsx:31`, `components/reserve/ui-primitives.tsx:63`).
- **Haptics**: Implemented through `navigator.vibrate` without fallback animations (`components/reserve/booking-flow/haptics.ts:1`). No feature detection beyond try/catch.
- **Visual feedback**: Frequent use of tinted backgrounds (`bg-amber-50`, `bg-slate-50`) for status banners and summaries (e.g., `ConfirmationStep` hero banners lines 64–105). Text tokens mainly `text-slate-700/600/500`.
- **State management**: Entire flow is a client component with reducer and fetch logic in `booking-flow/index.tsx`. Steps imported as clients; no dynamic imports or code splitting. Sticky progress renders even when hidden.

## Verifications & Measurements
- **Contrast re-check** using Node luminance function:
  - `bg-amber-50` (`#fffbeb`) with `text-slate-700` (`#334155`) → ratio ≈ **9.99**.
  - `bg-slate-50` (`#f8fafc`) with `text-slate-600` (`#475569`) → ratio ≈ **7.24**.
  - `bg-amber-50` with `text-slate-500` (`#64748b`) → ratio ≈ **4.59** (passes AA body but close to threshold; small text risk).
  - Script command logged in shell history (`node -e ...`). Confirms prior audit’s 1.64–2.30 may come from different palette variants or opacity layers—needs reconciliation.
- **Touch target validation**: compared against Apple HIG 2023 (44×44pt) and Material 3 (48×48dp). Current `h-10` and `h-4` fall short by 4–8px vertically/28–32px overall area.
- **Responsive checks**: Grep for `lg:` & `xl:` under `components/reserve` returned only button size variant (no layout breakpoints). Confirms single-column experience across desktop/tablet.
- **Safe-area padding**: repo contains no occurrences of `env(safe-area-inset-bottom)` or similar utilities → sticky footer lacks iOS notch accommodations.

## External Considerations
- Brand palette unspecified; we must propose new accessible tokens but highlight approval path.
- No explicit performance budget; bundling changes should stay mindful but can introduce lazy loading.
- Prior task folders (e.g., `tasks/ux-review-booking-flow/`) exist; ensure new recommendations sync with previous audits if referenced.

## Risks & Unknowns
- Actual production palette or design system might diverge; need brand sign-off for token changes.
- Live analytics not accessible; assumptions about funnel friction need future validation.
- Device matrix testing (especially tablet landscape and mobile safe areas) required post-change.

