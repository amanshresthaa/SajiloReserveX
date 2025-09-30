# Research – build-missing-module-deps

## Follow-up questions to clarify scope

- Do we simply need to restore missing third-party packages (`react-hot-toast`, `react-tooltip`), or is there an intentional migration to a different toast/tooltip system underway?
- Are we expected to align with an existing design system alternative (e.g., the Radix-based `components/ui/tooltip.tsx`) instead of re-installing `react-tooltip`?
- Should we audit for unused imports or consolidate toast helpers to reduce dependency surface?

(No additional direction received yet, proceeding with repository investigation based on current failure logs.)

## Existing patterns & context

- `react-hot-toast` is imported across client components (`components/LayoutClient.tsx`, `components/ButtonLead.tsx`, dashboard dialogs, and hooks like `useCancelBooking.ts` / `useUpdateBooking.ts`). Tests in `reserve/tests/unit/*` mock the same module, implying it is part of the expected runtime surface.
- `package.json` already lists both `react-hot-toast@^2.6.0` and `react-tooltip@^5.29.1` as production dependencies; the `pnpm-lock.yaml` includes both packages, signalling they are part of the locked dependency graph.
- The failure arises during `next build` bundling with `Module not found: Can't resolve 'react-hot-toast'` (and `react-tooltip`) which usually indicates missing modules on disk or a broken `node_modules` symlink structure rather than missing entries in `package.json`.
- The project targets `pnpm` (see `engines.pnpm >= 9.0.0`) but recent logs show `npm run build`; if installation occurred via a different package manager or with `--production`, the workspace symlinks for these dependencies might not have been materialized.
- No alternate toast or tooltip implementations are registered globally; `components/ui/tooltip.tsx` wraps Radix primitives but `LayoutClient` still expects `react-tooltip`. Replacing the imports would require broader UI alignment.

## External references

- `react-hot-toast` 2.6.0 supports React 16+ and works in Next.js 13/14/15; no breaking notes found regarding React 19 compatibility.
- `react-tooltip` 5.29.1 exports the `Tooltip` component used in `LayoutClient` and is tree-shakable; no known incompatibilities with Next 15.5.x.

## Interim conclusion

- The most probable cause is that the dependencies were not installed in the active `node_modules` tree (e.g., running `npm ci --omit=optional` or using a mismatched package manager). Reinstalling via `pnpm install` (or explicitly re-adding the packages) should restore the modules and unblock the build.
- Secondary verification should confirm that the re-installed packages resolve the bundler errors and that no lingering import aliases are broken.
