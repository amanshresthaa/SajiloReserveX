# Research: Wizard Step Consolidation

## Requirements

- Functional:
  - Generate a single human-portable artifact (JSON) that captures the up-to-date frontend source for the Booking Wizard steps (Plan, Details, Review, Confirmation) so stakeholders can audit or ingest all step code without traversing the repository.
  - Include each step component plus the supporting forms/components and hooks they rely on so the artifact is self-contained from a UI perspective.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Artifact must remain UTF-8/ASCII and deterministic (stable key ordering) to keep diffs reviewable.
  - Avoid bundling unrelated assets (images, tests) to keep file size manageable (<1 MB target) while still covering all step code.
  - No secrets or runtime environment data should appear in the export; it should strictly mirror source files already tracked in git.

## Existing Patterns & Reuse

- `context/table-assignment-code.json` already snapshots core backend modules via a small Node script (documented in `context/README.md`); we can reuse the same approach to serialize step files safely.
- `context/sticky-footer-consolidated.json` proves this repo accepts curated context artifacts for the wizard UI shell, so extending that directory with another JSON bundle keeps documentation consistent.
- Booking wizard step files already live under `reserve/features/reservations/wizard/ui/steps/**` with hooks in `reserve/features/reservations/wizard/hooks/**`, so we can enumerate them explicitly instead of globbing.

## External Resources

- [`context/README.md`](../../context/README.md) – describes how the table-assignment bundle is generated; follow its scripting pattern for determinism.
- [`reserve/features/reservations/wizard/ui/BookingWizard.tsx`](../../reserve/features/reservations/wizard/ui/BookingWizard.tsx) – shows which steps participate in the flow (Plan, Details, Review, Confirmation) and therefore which files must be covered.
- [`reserve/features/reservations/wizard/hooks`](../../reserve/features/reservations/wizard/hooks) – contains the per-step controllers (`usePlanStepForm`, `useDetailsStepForm`, etc.) that drive the UI; include these to make the artifact meaningful.

## Constraints & Risks

- Missing even one supporting module (e.g., `PlanStepForm` or `useReviewStep`) would make the consolidated artifact incomplete and less useful for reviewers.
- Paths must be recorded relative to repo root so future scripts or readers can map them back easily.
- JSON serialization must escape quotes/newlines correctly; manual concatenation risks invalid JSON.
- Artifact drift is possible if we do not document regeneration steps inside the task or `context/README.md`.

## Open Questions (owner, due)

- Q: Should we include component stories/tests or limit to production source? (owner: eng, due: now)
  A: For this request we will limit to production source files (components, hooks, types) to minimize size while still covering runtime behavior; tests/stories can be added later if requested.

## Recommended Direction (with rationale)

- Curate an explicit file list covering:
  - Step shells (`PlanStep.tsx`, `DetailsStep.tsx`, `ReviewStep.tsx`, `ConfirmationStep.tsx`).
  - Plan step internals (`plan-step/PlanStepForm.tsx`, `plan-step/components/*.tsx`, `plan-step/types.ts`).
  - Step-specific type definitions (`details-step/types.ts`, `review-step/types.ts`, `confirmation-step/types.ts`).
  - Controllers/hooks (`usePlanStepForm.ts`, `useDetailsStepForm.ts`, `useReviewStep.ts`, `useConfirmationStep.ts`).
- Write a Node script (one-off command or helper script) that reads each file, sorts keys, and writes `context/wizard-steps-consolidated.json` via `JSON.stringify(data, null, 2)` for readability.
- Document the regeneration command in `context/README.md` and capture verification steps (e.g., `jq 'keys'`) so future updates stay reproducible.
