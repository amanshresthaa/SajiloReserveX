# Research: Navbar & CTA alignment

## Primary navigation components

- `components/marketing/Navbar.tsx` (new homepage nav) renders static CTA links (`Browse restaurants`, `Sign in`) without checking Supabase session state. Nav items only include `#restaurants` + `My profile`; logged-in destinations like `/dashboard` are missing. Mobile dialog duplicates the static buttons.
- Blog pages use a separate legacy header in `app/blog/_assets/components/HeaderBlog.tsx`, relying on `ButtonSignin` (DaisyUI styling) for the CTA. It also lacks session-aware labels/destinations.
- Authenticated layouts (`app/(authed)/dashboard/layout.tsx`, `app/(authed)/profile/layout.tsx`) display header-level CTAs that still link to `/reserve`, which now redirects to `/`.

## CTA components + styling

- `components/ButtonSignin.tsx` fetches the Supabase user to swap between “Get started” and an avatar/account link, but it returns DaisyUI `btn` classes and exposes only coarse styling via `extraStyle`. Other CTA helpers (`ButtonLead`, `ButtonCheckout`, `CTA.tsx`, `Hero.tsx`) also use DaisyUI classes, leading to inconsistent styling compared to the shadcn `buttonVariants` used elsewhere.
- Marketing homepage hero (now in `app/page.tsx`) embeds CTA links directly with `buttonVariants`, duplicating logic that should stay in sync with the navbar.

## Session handling today

- We duplicate Supabase session lookups (`ButtonSignin`, `Header`, `HeaderBlog`) with slightly different behaviors. None of the marketing CTAs change labels/destinations when the user is signed in (e.g., showing “Dashboard” + “Manage profile”).
- Authenticated sections already assume a signed-in user but don’t offer a quick path back to the main booking flow after `/reserve` changes.

## Opportunities

- Centralize session detection in a reusable hook/component for marketing CTAs (navbar + hero + blog header) so labels/targets flip appropriately.
- Replace legacy DaisyUI button styling with shadcn `buttonVariants` for consistency and to simplify maintenance.
- Update authed layout CTAs to link directly to `/` (new booking entry), keeping terminology aligned.
