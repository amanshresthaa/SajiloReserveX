# Plan – reserve decouple ui primitives

1. Copy the required UI primitives from `components/ui` into `reserve/shared/ui`, swapping `@/lib/utils` for the SPA `cn` helper.
2. Update wizard components and shared utilities to import from `@shared/ui/...` instead of `@/components/ui/...`.
3. Replace the Radix-dependent `Progress` with a lightweight inline implementation to avoid new package requirements.
4. Run Vitest to confirm everything still passes.
