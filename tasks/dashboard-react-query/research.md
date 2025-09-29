# Dashboard React Query — Research

## Task Outline & Subtasks

- Determine whether the Next.js App Router already has a React Query provider; if not, plan how to introduce one consistent with existing patterns.
- Inspect the monorepo for existing HTTP helpers/layouts that can be reused (e.g. in `reserve/`).
- Understand requirements from Sprint Story B1: introduce `QueryClientProvider` near the app root, add `fetchJson` helper with normalized errors, add `queryKeys` namespace, and supply unit tests.

## Findings

- No React Query setup exists in the top-level Next.js app (`app` directory). React Query is only wired in the `reserve/` sub-app, which exposes `ReserveProviders` (stateful query client + devtools) — good reference for patterns (see `reserve/app/providers.tsx`).
- `reserve/shared/api/client.ts` contains a fetch wrapper that normalizes errors into `{ code, message, status }`. We can mirror a simplified version tailored to the dashboard using the sprint contract (`fetchJson` returning `{ message, status, code }`).
- There is no shared query key registry yet. We'll create `lib/query/keys.ts` to keep booking dashboard keys centralized.
- Testing stack: project uses Vitest (see `package.json`) with existing tests under `reserve/` & `database/tests`. We'll add a new Vitest spec alongside the helper (e.g. `lib/http/fetchJson.test.ts`) to validate error shaping.
- For provider placement: `app/layout.tsx` renders `ClientLayout` inside the `<body>`. We'll introduce a new client component (e.g., `app/providers.tsx`) to wrap React Query provider around children, and import it from `app/layout.tsx` to keep server/client boundaries clean.

## Considerations & Risks

- Ensure the provider remains client-side (React Query requires access to state); we can follow the `useState(() => new QueryClient())` pattern as in `reserve`.
- React Query Devtools must stay dev-only (`NODE_ENV !== 'production'`). We'll conditionally render to avoid bundling in production builds.
- `fetchJson` should include `credentials: 'include'`, accept an optional `AbortSignal`, and gracefully handle non-JSON error bodies.
- Need to keep helper tree-shakeable and TypeScript-friendly (generic return types, typed error). Expose a named `HttpError` interface to align with sprint copy.
- Add lint-safe client components (`'use client';` directives) where necessary.

## Open Questions

- None outstanding; requirements are unambiguous.
