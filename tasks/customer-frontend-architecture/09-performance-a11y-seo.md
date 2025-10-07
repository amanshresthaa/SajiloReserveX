# 9. Performance, Accessibility, SEO Plan

## Performance Strategy

- **Budgets**: LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms, TTI ≤3.5 s (P75 on mid-tier Android over Fast 4G); initial JS ≤200 KB gzipped; total payload ≤1 MB.
- **Rendering**: Ship route groups via Next.js App Router with **server components** for marketing pages; use **client components** only when interactivity is required (booking forms, dashboard tables).
- **Code Splitting**:
  - Marketing bundle kept lean by lazy-loading blog, reservation explainer modules, and testimonial carousels.
  - Dashboard charts loaded with `React.lazy` + Suspense skeletons.
  - Shared layout primitives extracted to `components/layout/*` to avoid duplication.
- **Data Fetching**:
  - Use Next.js `fetch` with caching revalidate hints (`revalidateTag`) for marketing content.
  - React Query manages authed data with stale-while-revalidate semantics; prefetch dashboard queries on server and hydrate via `dehydrate`.
- **Images**:
  - Next.js `<Image>` with AVIF/WebP priority for hero assets; responsive `sizes` attributes; lazy-load below-the-fold content.
  - Explicit width/height (or aspect ratios) to eliminate CLS; apply `priority` only to first fold hero image.
- **Fonts**:
  - Self-host variable font subset using `@next/font/local`; swap strategy `font-display: optional` to prevent FOIT.
  - Use system font fallback for body text; load accent font only for headings.
- **Caching**:
  - `Cache-Control` headers: `public, max-age=600, stale-while-revalidate=86400` for marketing pages.
  - Service worker (phase 2) caches static assets; current scope ensures CDN cache via Vercel.
- **Monitoring**:
  - Integrate Lighthouse CI + WebPageTest profiles (Mobile Chrome 4G).
  - Real User Monitoring (future Sentry performance add-on) to validate budgets.
- **Device QA**:
  - Run Playwright tests with emulated iPhone 13 and Pixel 7; manual Safari Low Power Mode checks.
  - Use Chrome DevTools CPU throttling 4× to simulate low-end devices.

## Accessibility Plan

- **Conformance**: WCAG 2.2 AA baseline; touch targets meet AAA (≥44 px); color contrast ≥4.5:1 across states (`hover`, `active`, `focus`).
- **Focus Management**:
  - Skip link at top of DOM; `scroll-margin-top` on headings for deep links.
  - Manage focus on modals/drawers using Radix primitives; return focus on close.
- **Semantics**: Prefer native elements (`button`, `a`, `label`, `table`); ARIA used only to augment semantics.
- **Keyboard Support**:
  - Booking flow steps navigable via `Tab` / `Shift+Tab`; `Enter` submits forms; `Space` toggles checkboxes; trap focus inside dialogs.
  - Provide `⌘/Ctrl+Enter` shortcut for text-area submits (feedback forms).
- **Assistive Copy**:
  - Provide SR-only context for icon-only buttons (e.g., `aria-label="Cancel booking"`).
  - Inline validation errors announced via `aria-live="polite"`; focus first invalid field.
- **Reduced Motion**: CSS `@media (prefers-reduced-motion)` variants for transitions; disable non-essential animations.
- **Testing**:
  - CI runs axe-core via Playwright; fails build on critical violations.
  - Manual screen-reader smoke test (VoiceOver, NVDA) each release increment.
- **Content Resilience**: Ensure layouts stretch for long restaurant names, multi-line CTAs, translated copy.

## SEO Plan

- **Technical SEO**:
  - Generate XML sitemap and submit to search consoles; update on deploy.
  - Use `next-sitemap` for canonical URLs and alternate language placeholders.
  - Robots: allow crawl of marketing + blog, disallow `/dashboard`, `/profile`, `/api/*`.
- **Structured Data**:
  - `Restaurant` schema on restaurant detail pages; `Reservation` schema on booking confirmation; `Service` on reserve landing; `Article` on blog posts.
  - Provide JSON-LD via Next.js `generateMetadata`.
- **Metadata Discipline**:
  - Titles ≤55–60 characters, descriptions 145–155 characters; include primary keyword + brand.
  - Open Graph + Twitter cards for major routes.
- **Content Strategy**:
  - Blog cadence: weekly publication with evergreen restaurant guides; internal linking from home/reserve.
  - Localization-ready copy with variable placeholders (`{{restaurantName}}`) to ease future l10n.
- **Performance SEO**:
  - Optimize hero media; defer non-critical scripts (`plausible.js` async, `defer`).
  - Preconnect to Supabase + Plausible; use HTTP/2 server push replacements (`preload`) for critical CSS.
- **Analytics SEO Loop**:
  - Track search terms via Google Search Console; feed into blog backlog.
  - Monitor schema coverage using Rich Results Test automation.
