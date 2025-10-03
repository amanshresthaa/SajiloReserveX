# Implementation Plan

## Goal

Restore the application styling that regressed after the DaisyUI → shadcn migration by ensuring Tailwind generates the expected design tokens and utility classes. Primary symptom is that the landing page renders unstyled (screenshot from user).

## Approach

1. **Reinstate Tailwind token bridge in `app/globals.css`.**
   - Re-introduce the `@custom-variant dark` declaration so `dark:` utilities target the `.dark` class (per shadcn setup).

- Add back the `@theme inline { ... }` block that maps Tailwind tokens (`--color-primary`, `--color-background`, etc.) to the CSS variables defined under `:root`/`.dark`. Use the values already present in the file to avoid duplication, mirroring the working backup (`app/globals.css.backup-20251003-163824`).
- Ensure we keep the newer accessibility/base rules that were added, but fill any missing gaps so utilities like `bg-background`, `text-muted-foreground`, etc. are generated again.

2. **Restore custom animation utility classes relied on across the codebase.**
   - Re-add the `.animate-opacity`, `.animate-appear-from-right`, `.animate-wiggle`, `.animate-popup`, etc. definitions from the backup so components using these classes behave correctly.
   - Verify existing new animations (`fade-in`, `fade-up`, etc.) do not conflict.

3. **Review Tailwind configuration for token consistency.**
   - Confirm `tailwind.config.js` still works with the CSS-provided theme tokens. If the `sr-*` color extensions are redundant, leave them untouched but ensure standard shadcn tokens (`primary`, `background`, etc.) resolve via `@theme inline` (no direct config change needed unless compilation still fails).
   - If we detect missing tokens after step 1, add the minimal config entries to extend colors referencing `var(--color-...)` to match shadcn conventions.

4. **Verify styling locally.**
   - Run `pnpm dev` (or appropriate check) to ensure Tailwind rebuilds and the landing page regains styling. Capture any console warnings/errors and fix if necessary.
   - Spot-check components that use the restored animations/classes (e.g., `Testimonials11`, `ButtonGradient`).

## Deliverables

- Updated `app/globals.css` with restored theme and animation definitions while preserving accessibility enhancements.
- Any required `tailwind.config.js` tweaks if tokens still missing.
- Notes on manual verification steps performed and any follow-up questions/risks.
