# Dashboard Auth Guard — Manual Smoke Test

1. Visit `/dashboard` while signed out → expect redirect to `/login?redirectedFrom=%2Fdashboard`.
2. Sign in via Supabase magic link flow; reload `/dashboard` → page renders the scaffold with header + “New booking” button.
3. From the marketing header, once signed in, confirm the “Dashboard” link appears in both desktop and mobile navigation menus.
4. Sign out and ensure the “Dashboard” link disappears and visiting `/dashboard` redirects again.
