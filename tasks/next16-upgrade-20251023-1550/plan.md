# Implementation Plan: Next 16 Upgrade

## Objective

We will upgrade the Next.js application to v16 so that we align with current platform requirements, unlock Turbopack defaults, and keep our dependency stack supported.

## Success Criteria

- [x] Node 20.11.x (≥20.9) enforced locally and in CI (`package.json` engines already satisfied; CI workflow updated).
- [x] `next`, `react`, `react-dom`, `eslint`, `eslint-config-next`, `typescript`, `@types/{react,react-dom,node}` bumped to compatible latest versions with a clean `pnpm-lock.yaml`.
- [x] `middleware.ts` successfully migrated to `proxy.ts` with identical behavior validated via build/tests.
- [x] Codemod-driven updates applied and audited; `pnpm lint`, `pnpm build`, and targeted tests succeed, with findings recorded in `verification.md`.

## Architecture & Components

- `proxy.ts`: new entry point replacing `middleware.ts`, default export `proxy(req)` returning Supabase-authenticated redirects and API headers.
- `next.config.{js|ts}`: evaluate codemod output; ensure alias resolution works with Turbopack (add `experimental.turbo.resolveAlias` if needed).
- `package.json` scripts: confirm `dev`, `build`, `start`, `lint` map to Next 16 defaults and lint targets entire repo.
- `.github/workflows/ci.yml`: pin Node to `20.11.x` and ensure lint/build/test steps align with new scripts.

## Data Flow & API Contracts

- Proxy flow: request enters `proxy(req)`, attaches Supabase session, sets deprecation headers for unversioned `/api/*`, enforces protected route redirects. No API request/response changes expected; ensure `config.matcher` equivalent preserved.
- Dependency upgrades should not modify external API contracts; monitor for TypeScript or ESLint rule changes that could flag existing code.

## UI/UX States

- No intentional UI changes; confirm that core routes render after upgrade on dev/build.
- Verify metadata-driven pages (`generateMetadata`) still produce correct head tags; spot-check one reservation page and one blog article.

## Edge Cases

- Supabase session absence on protected routes still redirects correctly after proxy migration.
- API routes should continue emitting deprecation headers; ensure Next 16 proxy runs on Node runtime (no Edge-specific behavior change).
- Alias resolution under Turbopack—watch for module-not-found errors during dev/build.
- Tailwind/PostCSS integration should continue functioning with updated dependency versions.

## Testing Strategy

- Unit: run `pnpm test` (Vitest) for critical logic.
- Integration: rely on `pnpm build` to surface Next config issues; run `pnpm typecheck` to catch TypeScript regressions.
- E2E: smoke via existing Playwright command if time permits; at minimum, ensure `pnpm test:e2e --project=mobile-chrome --grep @mobile-smoke` documented for follow-up.
- Accessibility: no new UI, but re-run linting and manual spot-check for runtime console errors during verification.

## Rollout

- Feature flag: none required; change is global.
- Exposure: merge to main once CI passes; monitor production logs specifically for proxy redirect issues.
- Monitoring: review Supabase auth logs and Next server errors post-deploy; confirm analytics remain intact.
