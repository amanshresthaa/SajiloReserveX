# Implementation Plan: Table Assignment Business Rules Extraction

## Objective

We will enable analysts and developers to understand all enforced business rules around table assignment and capacity so that onboarding and auditing become self-service.

## Success Criteria

- [ ] All rules identified across schema, TypeScript logic, and configuration captured in docs/table-assignment-business-rules.md.
- [ ] Each rule annotated with source path and rule type.
- [ ] Verification.md documents review approach and remaining uncertainties.

## Architecture & Components

- Documentation target: docs/table-assignment-business-rules.md structured by rule class:
  - Database constraints & triggers (hard constraints/workflows).
  - SQL functions/RPCs (validations, workflows).
  - TypeScript capacity logic (filters, manual validation, scoring soft constraints).
  - Policy/config/feature flag defaults (policies & conditional workflows).
- Supporting artifacts: research.md, todo.md, verification.md per SDLC.
  State: maintained in task folder | URL state: n/a

## Data Flow & API Contracts

- Inputs: SQL migrations, TypeScript capacity logic, demand profile configs, feature flags.
- Outputs: Markdown documentation of business rules with source references and rule type classification.
- Errors: n/a (documentation effort)

## UI/UX States

- n/a (documentation)

## Edge Cases

- Rule duplication or conflicting interpretations.
- Implicit rules embedded in triggers/functions.
- Divergent definitions between consolidated schema and incremental migrations—must reconcile with latest migration order.

## Testing Strategy

- Manual cross-check of extracted rules against source files.
- Use multiple search commands (`rg`, `sed`, `psql` parsing or `node` parsing where helpful) to validate.
- Double-source verification: compare both consolidated schema and latest migrations; confirm TypeScript exports have consistent usage (e.g., `filterAvailableTables` vs. `evaluateManualSelection`).
- Tabulate verification evidence in verification.md including any unresolved ambiguities.
- Peer review readiness ensured by verification.md checklist.

## Rollout

- Feature flag: n/a
- Exposure: n/a
- Monitoring: n/a
- Kill-switch: n/a
