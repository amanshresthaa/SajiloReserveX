# Research: Next 16 Upgrade

## Existing Patterns & Reuse

- Root `middleware.ts` (to be renamed `proxy.ts`) gates `/api`, `/my-bookings`, `/profile` with Supabase session refresh and response headers (see `proxy.ts:1`). Needs 1:1 conversion to `proxy`.
- `next.config.js` customizes alias resolution inside the Webpack hook and sets `eslint.dirs` plus image domains (see `next.config.js:5`). Must confirm aliases survive Turbopack or add equivalent config.
- Tailwind already scans `./app`, `./pages`, `./components` (see `tailwind.config.js:4`); no content updates required if folders unchanged.
- Project scripts already include `dev`, `build`, `start`, `lint`, `typecheck`, `test` etc. `lint` currently scoped to `reserve` directory via `eslint reserve --ext .ts,.tsx`.
- GitHub Actions workflow `.github/workflows/ci.yml` provisions Node `20` and runs `pnpm lint`, `pnpm build`, etc.; only node version pinning likely needs refinement.

## External Resources

- [Next.js Upgrade Guide][1] — documents Node 20.9+ requirement and codemod usage.
- [Next.js Turbopack Notes][4] — clarifies Turbopack default behavior in v16.
- [Next.js Middleware → Proxy Migration][5] — describes new `proxy` file expectations.
- [Next.js Package Bump Guidance][2] — outlines `pnpm add next@latest react@latest`, ESLint updates.

## Constraints & Risks

- **Node requirement**: local Node is `22.12.0` (`node --version`; cross-checked via `node -p process.versions.node`), but CI pins `node-version: 20`. Need explicit `>=20.9.0` (e.g., `20.11.x`) to avoid older patch fallback.
- **Webpack-specific alias config** may be ignored by Turbopack; if codemod removes Webpack hook, we must ensure aliases continue to resolve, potentially via `experimental.turbo.resolveAlias`.
- `pnpm` lockfile is large; dependency bumps must preserve patched dependencies declared in `pnpm-workspace.yaml`.
- `lint` script limits scope to `reserve`. Next 16 expects running ESLint CLI manually; we should expand coverage to project root while balancing lint time.
- Root already depends on React 19.2 and `@types/react` 19.x; confirm Next 16 supports React 19 stable (docs indicate compatibility but verify after install).
- `middleware.ts` asynchronous logic relies on Supabase; migration to `proxy` must keep same behavior and header handling.

## Open Questions (and answers if resolved)

- Q: Does Turbopack support our current alias map?  
  A: Unknown until codemod adjustments; plan to review resulting config and test dev/build to confirm module resolution.
- Q: Any edge routes relying on legacy metadata/image APIs?  
  A: `rg generateMetadata` shows multiple implementations in `src/app/...` (e.g., `src/app/reserve/[reservationId]/page.tsx:60`). No `generateImageMetadata` or `ImageResponse` usage detected; still need manual validation post-upgrade.
- Q: Are there other workspaces needing version bumps (e.g., `reserve` Vite app)?  
  A: `reserve` uses Vite/React; Next upgrade may not impact but ensure shared dependencies remain compatible.
- Q: Working tree cleanliness requirement?  
  A: Currently untracked task folders (`git status --short`); acceptable for now but note before commit.

## Recommended Direction (with rationale)

- Update CI Node version to explicit `20.11.x` (>=20.9) to meet Next 16 requirement.
- Use `pnpm add next@latest react@latest react-dom@latest` plus ESLint/TypeScript bumps to align with Next 16 peer deps.
- Run `npx @next/codemod@canary upgrade latest` to automate config/script adjustments, then audit modifications (especially `next.config.*`, scripts, linting).
- Rename `middleware.ts` → `proxy.ts` retaining logic; adjust export to default `proxy` function with same flow.
- Reconfirm Tailwind/PostCSS config; only update if codemod requests or new plugin requirements arise.
- After dependencies and codemod, run `pnpm install`, `pnpm lint`, `pnpm build` to validate alias handling and metadata routes.
- Document verification steps (including manual checks of metadata endpoints) in `verification.md`.

[1]: https://nextjs.org/docs/app/building-your-application/upgrading/version-16
[2]: https://nextjs.org/docs/app/building-your-application/upgrading/version-16#package-upgrades
[4]: https://nextjs.org/docs/app/building-your-application/optimizing/turbopack
[5]: https://nextjs.org/docs/app/building-your-application/routing/proxy
