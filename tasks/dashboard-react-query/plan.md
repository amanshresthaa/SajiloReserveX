# Dashboard React Query — Plan

## Goal

Bootstrap React Query support for the main Next.js app as per Story B1: include a provider, HTTP helper with normalized errors, query key registry, and unit tests.

## Steps

1. **Provider Wiring**
   - Create `app/providers.tsx` (client component) that instantiates a `QueryClient` with sensible defaults, wraps children with `QueryClientProvider`, and conditionally attaches `ReactQueryDevtools` when `NODE_ENV !== 'production'`.
   - Update `app/layout.tsx` to include the new Providers wrapper around `ClientLayout` children while preserving existing structure.

2. **HTTP Helper & Error Types**
   - Add `lib/http/errors.ts` defining `HttpError` type plus a factory helper to normalize responses (`normalizeError`).
   - Add `lib/http/fetchJson.ts` implementing `fetchJson<T>` that accepts `RequestInfo`, optional init, ensures `credentials: 'include'`, propagates `AbortSignal`, and throws `HttpError` when response is non-2xx. Use `normalizeError` to keep error shape consistent with `{ message, status, code }`.
   - Export helper functions for later reuse.

3. **Query Keys Registry**
   - Introduce `lib/query/keys.ts` with namespaced key builders (e.g., `bookings.list(params)`), returning arrays to use with React Query.

4. **Testing**
   - Add Vitest spec `lib/http/fetchJson.test.ts` to cover success case, JSON error body, non-JSON error body, and ensures `credentials: 'include'` is set and error shape matches.
   - Use `global.fetch = vi.fn()` mocks within tests.

5. **Documentation / Notes**
   - Update task TODO with smoke instructions or integration notes if needed.

## Verification

- Run `pnpm test --filter fetchJson` (or appropriate command) to validate the new unit test.
- Ensure `pnpm lint`/typecheck (if time allows) or note if skipped.
