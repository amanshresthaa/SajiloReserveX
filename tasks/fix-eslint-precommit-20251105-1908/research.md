# Research: Fix pre-commit ESLint errors

## Requirements

- Functional: Pre-commit (husky + lint-staged) must pass with `eslint --fix --max-warnings=0`.
- Non-functional: Keep changes minimal; follow existing email template patterns.

## Existing Patterns & Reuse

- Email templates use template literals and inline styles; `escapeHtml` utilities exist in `server/emails/base.ts` and `server/emails/bookings.ts`.

## Constraints & Risks

- Rule `no-useless-escape` flags unnecessary escapes inside template literals.
- `--max-warnings=0` escalates warnings to failures; unused imports/functions must be resolved.

## Open Questions (owner, due)

- None for this fix.

## Recommended Direction (with rationale)

- Replace unnecessary escaped quotes in template literals with plain quotes.
- Remove or neutralize unused symbols (drop unused imports; export otherwise-unused function to avoid warning) to keep diff small.
