# Major Pitfalls, Gaps, and Recommendations — SajiloReserveX

Generated: 2025-11-03 (UTC)

This document captures critical routing/auth/flow pitfalls, missing documentation, and concrete remediation proposals with actionable steps and code reference pointers.

---

## 1) Inconsistent Authentication Guard Patterns

- Issue: Mixed redirect behaviors (`/signin` vs `/ops/login`).
- Risk: Users confused which login to use; ops may land on customer sign-in.
- Impact: Poor UX, broken redirect chains, potential security confusion.
- Evidence:
  - Customer sign-in: `src/app/signin/page.tsx`, callback `src/app/api/auth/callback/route.ts`.
  - Ops login page: `src/app/(ops)/ops/(public)/login/page.tsx`.
  - Guards in server components (e.g., `src/app/(ops)/ops/(app)/page.tsx:16`).
- Recommendation:
  - Centralize guard and redirect logic via middleware (single source of truth) and a unified sign-in entry (`/signin`) with `?context=ops|customer`.
  - Map `/ops/login` → 301 to `/signin?context=ops`.
  - Only allow `redirectedFrom` to safe, same-origin, non-auth routes.

## 2) Token-Based State in `/thank-you`

- Issue: Optional `?token=` query drives booking fetch.
- Risk: URL token exposure (history, logs, screenshots, referrer).
- Impact: Potential booking info leakage.
- Evidence: `src/app/thank-you/page.tsx:73` fetches `/api/bookings/confirm?token=...`.
- Recommendation:
  - Adopt PRG pattern with short-lived server-side session key:
    1. POST booking → server stores ephemeral confirmation key (DB or encrypted cookie).
    2. Redirect to `/thank-you` without token; page fetch uses cookie/session.
  - If token must be used, ensure one-time, short TTL, and `Referrer-Policy: no-referrer` + strip token after first render (router.replace).

## 3) No Clear Error/Fallback Routes

- Issue: No documented 404/500/auth-failure pages in flows.
- Risk: Broken states with no recovery.
- Impact: Poor UX; support load.
- Evidence: Ad-hoc `notFound()`/`redirect()` in pages.
- Recommendation:
  - Add standard App Router files: `src/app/not-found.tsx`, `src/app/error.tsx` (and route group variants for ops).
  - Add a friendly auth-failure/info page and link it from guards.

## 4) Ambiguous Booking Entry Points

- Issue: Three entry points — `/reserve`, `/reserve/r/[slug]`, `/item/[slug]`.
- Risk: URL confusion, SEO dilution, split analytics.
- Impact: Duplicate content signals; user confusion.
- Recommendation:
  - Canonicalize on `/reserve/r/[slug]`.
  - Redirect `/item/[slug]` → `/reserve/r/[slug]` (301) and use `/reserve` solely as a search/landing.
  - Ensure `<link rel="canonical">` for venue pages.

## 5) Inline Wizard State Management

- Issue: Wizard renders inline (no route change), but Close navigates to `/thank-you`.
- Risk: No addressable steps; back button oddities; progress loss on refresh.
- Impact: Mobile UX and a11y risks; conversion drop-off.
- Recommendation:
  - Make steps URL-addressable: `/reserve/r/[slug]?step=plan|details|review|confirm`.
  - Persist draft in storage (already present) plus query-state; use `router.push/replace` per step for history.
  - On Close, decide consistent destination (thank-you or venue page) and document.

## 6) `/reserve/[reservationId]` Predictability

- Issue: Requires auth (good) but risk of predictable IDs.
- Risk: Enumeration if IDs guessable; auth bypass if other weaknesses exist.
- Impact: Potential unauthorized access attempts.
- Recommendation:
  - Ensure IDs are UUIDs (not sequential). If not, migrate.
  - Optionally support access via opaque short codes or signed tokens for share links.

## 7) Redirect Loop Potential

- Issue: `redirectedFrom` parameter can chain across flows.
- Risk: Circular redirects (e.g., `/ops` → `/signin?redirectedFrom=/ops` → failure → `/signin?redirectedFrom=/signin`).
- Recommendation:
  - Whitelist allowed `redirectedFrom` paths; drop or sanitize others.
  - Never allow `/signin`, `/ops/login`, `/api/*` as destinations.
  - Clear `redirectedFrom` after success to avoid replays.

## 8) No Rate Limiting Documentation (Public Booking)

- Issue: `/api/bookings` lacks documented limits.
- Risk: Spam/DOS/inventory exhaustion.
- Recommendation:
  - Introduce rate limiting (e.g., Upstash, in-DB counters, or edge middleware) per IP + per account + per venue.
  - Document error semantics (429), headers (`Retry-After`).

## 9) Ops vs Customer Context Bleed

- Issue: Walk-in booking uses same wizard component.
- Risk: Cross-context bugs; permission confusion.
- Evidence: Ops flow uses `mode="ops"` in `OpsWalkInBookingClient.tsx`.
- Recommendation:
  - Enforce context via DI: restrict actions/endpoints in ops mode (no customer-only side effects).
  - Server-side checks: ops endpoints re-validate roles.

## 10) Blog Route Ambiguity

- Issue: Blog route family minimally defined in docs.
- Risk: SEO/routing issues with conflicting slugs.
- Recommendation:
  - Constrain blog slugs to namespaced segment (`/blog/*` only) — already true — and document canonical rules.
  - Add sitemap entries and `noindex` for thin content.

---

## Critical Missing Documentation

- Session expiry behavior during long booking: what happens to drafts/session on expiry.
- Concurrent booking conflict resolution: flow when two users pick same slot; error surfaces.
- Mobile deep linking strategy: how venue URLs are shared, step param usage.
- Offline fallback routes: currently present for some pages; document global approach.
- A/B tests / feature flags affecting routes: naming and flip behavior.
- Localization route structure: whether `/en/`, `/es/` prefixes are planned.

---

## Recommendations & Implementation Plan

1. Centralize Auth Redirects (Middleware)

- Add `src/middleware.ts` to normalize:
  - If path in ops app group and unauth → `/signin?context=ops&redirectedFrom=<path>`.
  - Map `/ops/login` → `/signin?context=ops`.
  - Validate `redirectedFrom` against a safe allowlist.

2. Replace URL Tokens for `/thank-you`

- PRG approach:
  - On booking success, store ephemeral key server-side (DB or encrypted cookie).
  - Redirect to `/thank-you` without token; page fetches via authenticated cookie/session only.
  - Set `Referrer-Policy: no-referrer` on confirmation page.

3. Add Error Routes

- Implement global `not-found.tsx` and `error.tsx` in App Router; add ops variants in route group.
- Add an auth info/failure page referenced by guard errors.

4. Canonicalize Booking URLs

- 301 `/item/[slug]` → `/reserve/r/[slug]`; use `/reserve` as search only.
- Add canonical tags on venue pages.

5. Addressable Wizard Steps

- Add `step` param; persist progress to storage + URL.
- Update wizard navigation to push/replace per step for proper history and deep-linking.

6. Strengthen Reservation IDs

- Confirm UUID usage; if not, migrate IDs to UUID.
- For sharing, support optional signed short code.

7. Redirect Loop Guards

- Reject nested auth paths as `redirectedFrom`.
- Clear param after successful callback.
- Add loop detection (max hops) in middleware.

8. Rate Limiting & Abuse Prevention

- Add per-IP and per-venue rate limits for `/api/bookings`.
- Document `429` responses and client messaging.

9. Context Separation (Ops vs Customer)

- Ensure ops mode uses ops endpoints only; add role checks server-side.
- Hide customer-only UI in ops mode.

10. Blog Routing Hygiene

- Ensure `/blog/*` doesn’t overlap app slugs; add canonical/robots rules and sitemap entries.

---

## Acceptance Criteria (Examples)

- Visiting any guarded route unauthenticated yields a single, consistent redirect to `/signin?redirectedFrom=<path>&context=<ctx>`.
- `/thank-you` no longer accepts or leaks `?token=` in URLs; confirmation loads via server session only.
- `/item/[slug]` always redirects to `/reserve/r/[slug]`.
- Wizard supports browser back across steps; refresh returns to current step with preserved draft.
- Rate limiting returns `429` with `Retry-After` on abusive booking traffic.

---

## References

- Guards and redirects: `src/app/(ops)/ops/(app)/**/page.tsx`, `src/app/(authed)/my-bookings/page.tsx`, `src/app/reserve/[reservationId]/page.tsx`
- Thank-you token flow: `src/app/thank-you/page.tsx`, `src/app/api/bookings/confirm/route.ts`, `src/app/api/bookings/route.ts`
- Wizard navigation: `components/reserve/booking-flow/**`, `reserve/features/reservations/wizard/hooks/useReservationWizard.ts`
