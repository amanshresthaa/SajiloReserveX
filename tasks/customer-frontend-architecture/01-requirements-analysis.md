# 1. Requirements Analysis

**Project**: SajiloReserveX Frontend Architecture  
**Date**: 2024-10-07

## Concise Analysis (12 Bullets)

1. **Primary Audience → Journeys**: Time-constrained diners (25-55) with mobile-first behavior → Critical journeys: (a) Discover restaurant → book table in <2min; (b) View upcoming bookings → modify/cancel; (c) Return user → repeat booking with saved preferences.

2. **Secondary Audience**: Restaurant staff access customer bookings via separate admin interface (out of scope for this spec, but informs data model).

3. **Value Proposition**: "Zero-friction table reservations" — Real-time availability, no phone calls, instant confirmation, simple management dashboard. Differentiation: Supabase-powered speed, concierge-style support touchpoints, mobile-optimized UX.

4. **Jobs to Be Done (JTBD)**: (a) "Book a table quickly without friction"; (b) "Manage my reservations in one place"; (c) "See real-time availability to make confident choices"; (d) "Trust the system with my dining plans".

5. **Primary Goals**: **Conversion** (restaurant selection → completed booking >25%), **Activation** (repeat booking within 30 days >40%), **Retention** (monthly active users growth).

6. **Secondary Goals**: **SEO** (organic discovery via local search, restaurant names, "book table [city]"), **Education** (how it works, trust signals), **Onboarding** (progressive disclosure, tooltips, empty states).

7. **Risks/Unknowns**: (a) _Assumption_: Users trust OAuth/email login vs guest checkout (mitigation: offer both); (b) _Risk_: Mobile-first may alienate desktop power users (mitigation: responsive design, keyboard shortcuts); (c) _Unknown_: Optimal booking flow step count (current: 4 steps; test 3-step variant).

8. **Performance Budgets**: LCP <2.5s (desktop 3G), CLS <0.1, INP <200ms, TTI <3.5s (mobile 4G). Target bundle: initial JS <200KB gzipped, total page weight <1MB. Rationale: Competitors average 3.2s LCP; we differentiate with speed.

9. **Accessibility Targets**: WCAG 2.2 AA compliance (100%), Level AAA for touch targets (≥44px). Rationale: Legal compliance (UK Equality Act 2010), inclusive design increases TAM by ~15% (disability demographics).

10. **SEO Constraints**: (a) Server-side rendering (SSR) for all marketing pages; (b) Structured data (schema.org Restaurant, Reservation); (c) Semantic HTML5; (d) Sitemap generation; (e) Canonical URLs to prevent duplicate content (blog categories). Target: Rank top 3 for "[restaurant name] booking" within 6 months.

11. **Internationalization (i18n)**: Initial launch: en-GB only. Phase 2 (6-12mo): Expand to en-US, es-ES. No RTL support initially. Date/time formatting respects restaurant timezone (not user's). Currency: GBP defaults for messaging (no paid upgrades in scope).

12. **Offline/PWA Requirements**: _Assumption_: No offline booking (requires server validation for availability). Offline support limited to: (a) View cached booking history (read-only); (b) Offline detection banner with retry; (c) Service worker for static assets (future enhancement, not MVP).

## Non-Functional Requirements Summary

| Category          | Target                | Measurement              | Rationale                                     |
| ----------------- | --------------------- | ------------------------ | --------------------------------------------- |
| **Performance**   | LCP <2.5s             | Lighthouse CI + RUM      | Industry baseline; speed = conversion         |
| **Performance**   | CLS <0.1              | CWV monitoring           | Prevent user frustration, SEO ranking         |
| **Performance**   | INP <200ms            | Field data (Plausible?)  | Responsiveness perception threshold           |
| **Performance**   | TTI <3.5s (4G)        | Lighthouse               | Mobile-first; most users on mid-range devices |
| **Accessibility** | WCAG 2.2 AA           | axe-core audits          | Legal requirement + inclusive design          |
| **Accessibility** | AAA touch targets     | Manual QA                | Mobile usability, fat-finger prevention       |
| **SEO**           | Schema.org markup     | Google Rich Results Test | Enhanced SERP appearance                      |
| **SEO**           | Sitemap coverage      | Automated post-build     | Crawlability for all public pages             |
| **Security**      | CSP headers           | Security headers check   | XSS prevention, data protection               |
| **Uptime**        | 99.9% availability    | External monitoring      | Trust = uptime; bookings are time-sensitive   |
| **Compatibility** | Modern browsers (2yr) | BrowserStack spot checks | Balance support vs maintenance cost           |
| **Mobile**        | iOS 15+, Android 10+  | Device lab testing       | Covers 95%+ of mobile traffic                 |

## Success Metrics (KPIs with Targets)

| Metric                      | Target                               | Measurement Method                                         | Frequency  |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------- | ---------- |
| **Booking Conversion Rate** | >25%                                 | Plausible funnel (restaurant select → confirmation)        | Weekly     |
| **Time to Book (median)**   | <2 minutes                           | Plausible event timestamps (select_date → booking_created) | Weekly     |
| **Repeat Booking Rate**     | >40% (30-day)                        | Supabase query (distinct users with ≥2 bookings)           | Monthly    |
| **Dashboard Engagement**    | >60% of bookings viewed in dashboard | Plausible pageviews (/dashboard) vs total bookings         | Monthly    |
| **Error Rate**              | <2% of booking attempts              | Plausible error events + server logs                       | Daily      |
| **Page Load (P75)**         | LCP <2.5s                            | Real User Monitoring (future: Sentry/Datadog)              | Daily      |
| **Accessibility Score**     | 100% (axe-core)                      | CI pipeline (Playwright + axe)                             | Per commit |
| **Mobile Traffic**          | >70%                                 | Plausible device breakdown                                 | Weekly     |
| **SEO Organic Traffic**     | 30% MoM growth                       | Plausible source=organic                                   | Monthly    |
| **Customer Satisfaction**   | NPS >50                              | Post-booking email survey (Mailgun)                        | Quarterly  |

## Constraints Summary

- **Timeline**: Architectural spec only (implementation timeline TBD)
- **Budget**: Existing infrastructure (Next.js, Supabase, Plausible) — no new major vendors
- **Team**: Full-stack developers (React/TypeScript proficiency required)
- **Tech Stack**: Next.js 15 App Router, React 19, Supabase, Shadcn/ui, Plausible (non-negotiable)
- **Browser Support**: Last 2 versions of Chrome, Firefox, Safari, Edge (evergreen)
- **Device Support**: Mobile-first (375px-768px), tablet (768px-1024px), desktop (1024px+)
- **Legal**: GDPR-ready (Plausible = no cookies), UK Equality Act 2010 (a11y)

## Key Assumptions (Labeled)

1. **🔶 Assumption (Business)**: Users prefer instant booking over inquiry/waitlist model.
2. **🔶 Assumption (UX)**: 4-step booking flow (date/time/party → details → review → confirm) balances speed vs error prevention.
3. **🔶 Assumption (Auth)**: OAuth (Google) + email/password covers 95%+ of users; no SMS/2FA required initially.
4. **🔶 Assumption (Content)**: Static marketing content (home, reserve explainer, legal) updated quarterly; blog updated weekly.
5. **🔶 Assumption (Locale)**: en-GB audience tolerates UK English spelling (e.g., "favourite", "colour") — no US localization needed initially.
6. **🔶 Assumption (Monetization)**: Customer experience remains free-to-use during MVP; any paid offerings deferred and tracked separately.
7. **🔶 Assumption (Mobile)**: Native mobile app not required; PWA-like features (add to home screen) sufficient.
8. **🔶 Assumption (Data)**: Restaurant data updated by restaurant staff (not customers) — no user-generated content moderation needed.
9. **🔶 Assumption (Analytics)**: Plausible's event tracking sufficient; no need for Mixpanel/Amplitude-level funnels initially.
10. **🔶 Assumption (Performance)**: Next.js Edge Runtime not required; Node.js runtime sufficient for SSR.

---

**Next**: See `02-information-architecture.json` for full sitemap and navigation model.
