# Research: Route Scanner Improvement Sprint

## Requirements

- Functional:
  - Fix HTTP method detection using AST, support re-exports.
  - Guard detection honors nested route groups with overrides.
  - Mermaid IDs unique; detect collisions.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Deterministic outputs across runs.
  - Clear warnings for ambiguous cases.
  - No secrets or env-dependent behavior.

## Existing Patterns & Reuse

- `route-scanner.js` already outputs JSON, Mermaid, ASCII tree.
- Meta object supports `warnings`; extend rather than reinvent.
- Current sanitizeNodeId works for most paths; add duplicate detection.

## External Resources

- Next.js App Router routing groups: https://nextjs.org/docs/app/building-your-application/routing
- @babel/parser: https://babeljs.io/docs/en/babel-parser
- Mermaid syntax: https://mermaid.js.org/intro/

## Constraints & Risks

- AST parsing complexity; TypeScript syntax variants.
- Re-export `export * from` cannot be resolved locally without module graph; warn instead.
- Test runner includes `tests/server/**/*.test.ts`; place tests accordingly.

## Open Questions (owner, due)

- Q: Should `export { GET as handler }` count as GET for Next?  
  A: Treat as GET for scanner visibility; also emit a warning for aliasing.

## Recommended Direction (with rationale)

- Use @babel/parser with `typescript` plugin to extract exported HTTP methods robustly, including re-exports.
- Build route group list from `relativePath`, apply ordered guard rules with `public` override.
- Add duplicate Mermaid ID detection and log to `meta.warnings`.
