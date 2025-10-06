## Objective

Deliver actionable implementation blueprints addressing the five architecture concerns around the SajiloReserveX booking experience: UI consolidation, performance, TypeScript strictness, environment validation, and asynchronous side effects.

## Plan of Action

1. **Clarify Scope & Dependencies**
   - Reconfirm requirements and deliverables for each concern (see user brief).
   - Map cross-cutting dependencies (e.g., env validation prerequisites for job queue, strict mode implications for other refactors).

2. **Concern #1 — Dual UI Consolidation**
   - Catalogue legacy vs V2 wizard components and shared stores.
   - Define shared component library structure, adapters, and migration strategy.
   - Outline phased rollout with feature flag management and risk mitigations.

3. **Concern #2 — Performance Bottlenecks**
   - Document caching layer design, DB optimizations, and batching strategies.
   - Specify code changes, infrastructure additions (Redis/Upstash), and observability requirements.
   - Provide testing and load generation approach.

4. **Concern #3 — TypeScript Strict Mode**
   - Create staged roadmap for enabling strict flags, categorizing existing errors, and prioritizing migrations.
   - Supply representative fix patterns, guard utilities, and CI integration steps.

5. **Concern #4 — Build-Time Env Validation**
   - Define Zod schema architecture, validation scripts, and runtime accessor strategy.
   - Integrate with package scripts, CI/CD pipelines, and developer onboarding tooling.

6. **Concern #5 — Async Job Queue**
   - Evaluate queue technology (Inngest vs BullMQ) and outline infrastructure setup.
   - Describe API refactors, worker processes, monitoring, and failure handling.

7. **Risk, Rollback, and Testing Strategy**
   - For each concern, enumerate primary risks, rollback levers, and verification plans (unit/integration/e2e/load).

8. **Timeline & Sequencing**
   - Summarize suggested order of execution with dependencies and duration estimates.

9. **Deliverables Summary**
   - Produce concise checklists per concern to guide implementation tracking.

## Deliverable Format

- Provide consolidated write-up covering all concerns with sections: overview, plan, code excerpts, risks, rollbacks, testing, tooling, and metrics.
- Use concise bullets, tables, and code snippets mirroring repository conventions.
- Reference exact file paths and modules from the research phase to keep instructions grounded.
