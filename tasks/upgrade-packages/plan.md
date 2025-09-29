# Plan – Upgrade Dependencies

## Goal

Upgrade all project dependencies (Next.js app + Reserve Vite app) to their latest stable versions, replace deprecated packages, and resolve migration issues so the project builds, lints, tests, and runs without regressions.

## Assumptions & Guardrails

- Use `pnpm` as the primary package manager. Keep `pnpm-lock.yaml` authoritative; after updates, regenerate or remove `package-lock.json` to prevent drift.
- Target Node.js ≥ 20 to satisfy new toolchain requirements (ESLint 9, lint-staged 16, Vite 7).
- Maintain existing accessibility/performance guidelines; ensure lint/test/typecheck still succeed post-upgrade.
- Avoid changing application behaviour beyond what migrations require. Document any risk areas.

## Work Breakdown

1. **Dependency Inventory & Bump Strategy**
   - Update `package.json` dependencies and devDependencies to the latest semver releases (per research table).
   - Replace deprecated `@supabase/auth-helpers-nextjs` with `@supabase/ssr` in dependencies.
   - Remove unused/deprecated packages (e.g., `@types/mongoose` if not needed).
   - Add/adjust `engines` field for Node 20+ if missing.

2. **Supabase Auth Migration**
   - Swap imports in middleware, server components, route handlers, and client components to use `@supabase/ssr` exports (`createBrowserClient`, `createServerClient`, `createServerActionClient`, `createMiddlewareClient`).
   - Update helper initialization code to new signatures (pass headers/cookies via `cookies()`/`headers()`, ensure `cookiesToSet` handling mirrors previous functionality).
   - Verify env typing / Supabase client config works in both server and client contexts.

3. **Vite 7 + React Router 7 Upgrade (Reserve App)**
   - Update `reserve/vite.config.ts` for Vite 7 compatibility (e.g., ensure ESM export, check plugin usage, update `defineConfig`, review alias/SSR settings).
   - Adjust `reserve` scripts/tests if Vite CLI flags changed.
   - Migrate React Router usage in `reserve/app/router.tsx`, route definitions, and hooks per v7 guide (e.g., confirm error boundary signatures, loader/action expectations, `useRouteError` typing).

4. **Tooling Upgrades**
   - Update ESLint 9 configuration (likely migrate to flat config or use compatibility wrapper). Confirm compatibility of `eslint-config-next`, `@typescript-eslint`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`.
   - Update Vitest 3 config (`reserve/vitest.config.ts`) and ensure tests still run (check new default environment, watchers, reporters).
   - Update Playwright config if required by 1.55 (verify no breaking options).
   - Update `lint-staged`, Husky hooks, and any related scripts if CLI syntax changed.
   - Ensure `dotenv` usage follows named import (`config()` call) or `require`.

5. **Lockfile + Workspace Clean-up**
   - Run `pnpm install` to refresh `pnpm-lock.yaml`.
   - Decide on `package-lock.json`: either regenerate via `npm install` (if dual workflow required) or remove (document decision).
   - Verify no orphaned dependencies remain.

6. **Verification & QA**
   - Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` (where feasible) to ensure toolchain works.
   - Execute `pnpm next build` (or `pnpm build`) and `pnpm reserve:build` to confirm both apps compile.
   - Smoke-test critical flows locally if possible (at least start dev servers for sanity, or run targeted component tests).
   - Document outstanding issues or follow-up risks if any commands fail due to upstream bugs.

## Deliverables

- Updated `package.json`, `pnpm-lock.yaml`, and any other configuration files touched by migrations.
- Code changes for Supabase auth, Vite config, routing, ESLint/Vitest setups, etc.
- Verification log (commands run + results) recorded in the final response.
- Notes on residual risks or manual QA required.
