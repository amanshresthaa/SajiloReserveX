---
task: fix-terms-unescaped-entities
timestamp_utc: 2025-11-21T22:31:00Z
owner: github:@assistant
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Research: Fix unescaped quotes in terms page

## Requirements

- Functional: Resolve the `react/no-unescaped-entities` lint errors in `src/app/(marketing)/terms/page.tsx` so husky pre-commit passes.
- Non-functional (a11y, perf, security, privacy, i18n): Preserve the current wording/semantics of the Terms page; avoid introducing accessibility regressions or layout changes.

## Existing Patterns & Reuse

- Marketing pages in the `(marketing)` segment use simple static JSX content with escaped apostrophes/quotes; follow existing typography and layout.
- ESLint rule `react/no-unescaped-entities` is enforced repo-wide; similar fixes typically replace raw quotes with HTML entities.

## External Resources

- N/A (project-local lint rule enforcement).

## Constraints & Risks

- Content changes must remain semantically identical for legal text.
- Large dirty workspace; avoid touching unrelated files.

## Open Questions (owner, due)

- None identified; scope is narrowly constrained. (owner: assistant, due: before coding)

## Recommended Direction (with rationale)

- Update the offending string literals in `src/app/(marketing)/terms/page.tsx` to escape the double quotes (e.g., `&quot;`), keeping rendered copy unchanged and satisfying the lint rule.
