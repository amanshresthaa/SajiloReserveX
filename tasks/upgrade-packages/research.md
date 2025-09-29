# Research – Upgrade Dependencies

## Project + Tooling Snapshot

- Package manager: `pnpm` (README commands use `pnpm`; lockfile `pnpm-lock.yaml` is present). There is also a legacy `package-lock.json` that will need syncing or removal after upgrades.
- Frameworks: Next.js app (App Router) coexisting with a Vite-powered `reserve` sub-app that uses React Router.
- Styling: Tailwind CSS v4 already configured, includes PostCSS + tailwind-merge + tailwindcss-animate.
- Auth: Supabase helpers (`@supabase/auth-helpers-nextjs`) wired in server components, API routes, middleware, and client components.

## Dependency Status (selected highlights)

| Package                         | Current | Latest     | Notes                                                                                                                                                                                                                                     |
| ------------------------------- | ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`                          | 15.5.3  | 15.5.4     | Minor bugfix release (Next 15 stable). Should only require lockfile bump.                                                                                                                                                                 |
| `react`, `react-dom`            | 19.1.1  | 19.1.1     | Already latest.                                                                                                                                                                                                                           |
| `tailwindcss`                   | 4.1.13  | 4.1.13     | Already latest.                                                                                                                                                                                                                           |
| `@tailwindcss/postcss`          | 4.1.13  | 4.1.13     | Already latest.                                                                                                                                                                                                                           |
| `@tanstack/react-query`         | 5.65.0  | 5.90.2     | Multiple minor releases; check breaking changes (still v5).                                                                                                                                                                               |
| `react-hook-form`               | 7.53.0  | 7.63.0     | Minor updates; review changelog for API tweaks (e.g., stricter TS types).                                                                                                                                                                 |
| `@supabase/supabase-js`         | 2.57.4  | 2.58.0     | Minor bump.                                                                                                                                                                                                                               |
| `@supabase/auth-helpers-nextjs` | 0.10.0  | Deprecated | Supabase replaced helpers with `@supabase/ssr` (exports `createBrowserClient`, `createServerClient`, etc.). Requires code refactor where helpers are imported.                                                                            |
| `dotenv`                        | 16.4.5  | 17.2.2     | v17 drops CommonJS default export (`import { config } from "dotenv"; config();`). Check usage.                                                                                                                                            |
| `eslint`                        | 8.57.0  | 9.36.0     | Major upgrade. Needs config updates and compatible `@typescript-eslint` (already v8 which supports ESLint 9). Verify plugin compatibility (`eslint-config-next@^15`, jsx-a11y, import, etc.).                                             |
| `eslint-config-prettier`        | 9.1.0   | 10.1.8     | Works with ESLint 9; confirm extends array ordering.                                                                                                                                                                                      |
| `lint-staged`                   | 15.2.10 | 16.2.3     | v16 requires Node 20+, config format unchanged.                                                                                                                                                                                           |
| `@vitejs/plugin-react`          | 4.3.4   | 5.0.4      | Requires Vite 6+/7 and React 18+. Need to adopt new default options (automatic fast refresh config changed).                                                                                                                              |
| `vite`                          | 5.4.11  | 7.1.7      | Major upgrade. Check `reserve/vite.config.ts` for deprecated options (`optimizeDeps.esbuildOptions` changes, SSR config tweaks, plugin API updates). Confirm Node 18.18+ requirement.                                                     |
| `vitest`                        | 2.1.4   | 3.2.4      | Major upgrade; adjust config (`test` key renamed to `vitest`?) and expect new default reporters.                                                                                                                                          |
| `@playwright/test`              | 1.49.0  | 1.55.1     | Minor improvements; update `playwright.config.ts` if new options appear.                                                                                                                                                                  |
| `@types/react`                  | 19.1.13 | 19.1.15    | Patch update.                                                                                                                                                                                                                             |
| `rollup-plugin-visualizer`      | 5.14.0  | 6.0.3      | Major release requiring Node 18+, ESM-only exports. Confirm how we import in build scripts.                                                                                                                                               |
| `react-router-dom`              | 6.27.0  | 7.9.3      | Major upgrade. Review [React Router v7 migration guide](https://reactrouter.com/en/main/upgrading/v7). Data routers remain but some APIs tightened (e.g., `useNavigate` default, `createBrowserRouter` signatures, `unstable_` removals). |
| `@testing-library/react`        | 16.1.0  | 16.2.0     | Minor update.                                                                                                                                                                                                                             |
| `@testing-library/user-event`   | 14.6.1  | 14.6.2     | Minor update.                                                                                                                                                                                                                             |

## High-Risk / Breaking Areas to Investigate

- **Supabase auth helpers**: Need to switch imports (`createServerComponentClient`, `createClientComponentClient`, etc.) to the `@supabase/ssr` equivalents. Update server/client helper initialization and types. Ensure cookie handling still matches Next middleware and route handlers.
- **Vite 7 + plugin/react 5**: Check `reserve/vite.config.ts` for compatibility. Vite 7 tightened SSR and build config; may need to adjust `optimizeDeps`, alias, or environment variables. Update `reserve` scripts accordingly.
- **React Router 7**: Verify routes in `reserve/app/router.tsx` and `reserve/app/routes.tsx`. API differences include: `createBrowserRouter` default hydration, required `future` flags removal, error boundary shape changes, and `useRouteError` return type updates.
- **ESLint 9**: Confirm our config in `reserve/.eslintrc` (if any) or root ESLint config (likely `eslint.config.js` or `.eslintrc`). Need to migrate to flat config if not already. If still using legacy config, either keep via compatibility package or migrate.
- **dotenv 17**: If we `import dotenv from "dotenv"`, need to switch to named import or CommonJS require (`import dotenv from` no longer works). Search for usage (likely in `next.config.js`, scripts, or tests).
- **Husky + lint-staged**: Ensure Node engine in `package.json` meets new minimums (Node 20+). Update README instructions if needed.

## Open Questions / Follow-ups

1. Should we keep `package-lock.json` in sync after running `pnpm install`, or remove it entirely in favor of pnpm? (Currently both lockfiles exist.)
2. Are there environment constraints (Node version) we must respect on deployment infrastructure before bumping packages that now require Node 18.18+ or 20+?
3. Any private components relying on deprecated APIs (e.g., React Router 6 non-data routers, Supabase session management) that we must regression-test manually?

These findings will guide the upgrade plan in the next step.
