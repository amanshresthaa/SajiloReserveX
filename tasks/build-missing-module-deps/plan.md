# Plan – build-missing-module-deps

## Goal

Restore the production build so that `next build` succeeds by ensuring the runtime dependencies `react-hot-toast` and `react-tooltip` are available to the bundler.

## Steps

1. **Verify dependency declarations** – Double-check `package.json` to confirm both packages remain listed under `dependencies` (no code changes expected). This guards against silent removal.
2. **Rehydrate node_modules via pnpm** – Run `pnpm install` in the repository root so the lockfile materializes the missing packages. This respects the declared package manager from `engines` and should restore symlinks.
3. **Conditional re-add** – If `pnpm install` still leaves the modules unresolved, run `pnpm add react-hot-toast react-tooltip` to force re-linking (should be no-op but acts as repair). Ensure no unintended version drift.
4. **Rebuild** – Execute `pnpm run build` to confirm the Next.js compilation now completes without `Module not found` errors.
5. **Regression checks** – Scan the build output for residual warnings (e.g., deprecations) and record any follow-up actions if needed.
