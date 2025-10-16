# Implementation Plan: Fix Shadcn Imports Missing In Capacity UI

## Objective

We will enable the capacity configuration and tables features to use the expected UI utilities from Shadcn so that the build completes successfully and the UI keeps consistent styling.

## Success Criteria

- [x] Next.js `pnpm run build` succeeds without module resolution errors.
- [x] Components use shared UI primitives or documented alternatives.

## Architecture & Components

- `components/ui/select.tsx`: Shadcn select primitive composed with Radix Select; reused anywhere `@/components/ui/select` is imported.
- `components/ui/table.tsx`: Lightweight table wrappers for semantic tables with consistent styling.
- `components/ui/toast.tsx` & `components/ui/toaster.tsx`: Toast primitives and provider rendered in `LayoutClient` so `useToast` works.
- `hooks/use-toast.ts`: Wrapper exporting `toast`, `useToast`, and helpers aligned with Shadcn API; relies on the provider above.

## Data Flow & API Contracts

Endpoint: N/A (no API changes anticipated)
Request: N/A
Response: N/A
Errors: N/A

## UI/UX States

- `Select`: Uses Radix trigger/content with focus rings and disabled states.
- `Toast`: Supports default and destructive variants, optional actions/close, and accessible regions.
- `Table`: Provides base structure classes; feature components handle loading/empty states separately.

## Edge Cases

- Ensure Select handles controlled value updates (`onValueChange`) used in capacity/table components.
- Toast invocations with `variant: 'destructive'` render correctly.
- Table wrappers render gracefully when children are empty.

## Testing Strategy

- Unit: N/A for generated UI primitives.
- Integration: Validate through `pnpm run build` (compilation).
- E2E: N/A for this hotfix; existing suites cover flows.
- Accessibility: Radix-based components include keyboard support; manual QA via DevTools after UI verification.

## Rollout

- No feature flag; components become available immediately after merge.
- Monitor for new warnings/errors in Ops dashboard when QAing capacity/tables flows.
