# Dashboard Auth Guard — TODO

- [x] Update `middleware.ts` to redirect unauthenticated `/dashboard` requests to `/login` while keeping session refresh.
- [x] Add matcher configuration for `/dashboard/:path*`.
- [x] Scaffold `app/(authed)/dashboard/layout.tsx` and `page.tsx` with basic UI.
- [x] Investigate navigation for conditional dashboard link; implement if existing nav component found, otherwise document follow-up.
- [x] Note smoke test steps for QA in task notes.
