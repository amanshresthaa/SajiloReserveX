---
task: booking-flow-script
timestamp_utc: 2025-11-14T21:50:00Z
owner: github:@ai-agent
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Research: White Horse Allocation Parallel Stress Test

## Requirements

- Functional:
  - Stress-test the `white-horse-pub-waterbeach` allocation path using `scripts/run-slot-fill.ts` to drive sequential slots between a configured date/time window.
  - Exercise the entire flow (API entry, allocator inline/async stages, Supabase mutations) under varying concurrency to uncover the slowest hop.
  - Capture metrics (submitDurationMs, inlineDurationMs, seat waste) and aggregate per concurrency level.
  - Provide a defensible bottleneck narrative backed by log excerpts + telemetry alignment.
- Non-functional (a11y, perf, security, privacy, i18n):
  - Remote Supabase only; destructive DB scripts (`db:reset`, seeds) must target the configured remote URL from `.env.local`.
  - Environment validation via `pnpm run validate:env` (ensures Supabase + BASE_URL secrets exist).
  - Logging artifacts stored under `tasks/booking-flow-script-20251114-0912/artifacts/`; redact secrets.
  - Chrome DevTools manual QA is not triggered because this task is CLI/perf-only (per §1 non-overridable rules apply only when UI changes occur).

## Existing Patterns & Reuse

- `scripts/run-slot-fill.ts` already supports `--concurrency/--parallel`; use it rather than writing bespoke concurrency logic.
- `scripts/run-booking-flow.ts` emits structured metrics (`submitDurationMs`, `inlineDurationMs`, seat waste, reasons) and handles inline + background phases.
- Database prep pipeline described in `ALLOCATION_STRESS_TEST_README.md` provides the baseline commands (reset → seed-intelligent → seed-today → db:stress-test).
- `.env.local` is consumed by `dotenv` inside scripts; leverage `pnpm run validate:env` to confirm required Supabase keys exist before destructive commands.
- Diagnostic toggles (`DEBUG_CAPACITY_PROFILING`, `FEATURE_ALLOCATOR_V2_ENABLED`) are already referenced in server logging; set env vars at shell level before running scripts.

## External Resources

- [`ALLOCATION_STRESS_TEST_README.md`](ALLOCATION_STRESS_TEST_README.md) — lists database preparation scripts and expected data profile for stress scenarios.
- [`WHITE_HORSE_CONFIG.md`](WHITE_HORSE_CONFIG.md) — describes the specific restaurant topology / adjacency constraints (helps interpret seat waste and combos).
- Prior log artifacts in `tasks/booking-flow-script-20251114-0912/artifacts/` — show baseline sequential behavior; compare with new concurrent runs for regression detection.

## Constraints & Risks

- Remote Supabase resets are destructive; ensure confirmation of target DB before invoking `db:reset`.
- Scripts assume `.env.local` includes `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc. Missing values block runs.
- High concurrency may overrun Supabase connection limits; plan to adjust `--stress-max` or concurrency to avoid cascading failures.
- Each `slots-fill` iteration can exhaust available tables for a window; may need to monitor table inventory or widen time range to avoid deterministic failures.
- Logging volume grows quickly; need to manage artifact naming and disk usage (per instructions, keep under task folder).
- Potential DNS issues when hitting production base URLs (documented earlier) — plan fallback to local base URL yet note limitation.

## Open Questions (owner, due)

- Q: Is traffic targeting `http://localhost:3000` acceptable if VPN/DNS to prod remains blocked? (Owner: Engineering, due ASAP)
  A: Pending — default to localhost while documenting inability to reach prod.
- Q: Are additional feature flags (selector enumeration timeout / fail-hard) required for this run? (Owner: self, due before blast)
  A: Evaluate during planning; default to enabling recommended flags unless they destabilize flow.

## Recommended Direction (with rationale)

- Prepare DB via documented commands to ensure deterministic slot availability (reduces noise when comparing concurrency levels).
- Validate environment secrets upfront using `pnpm run validate:env` to avoid mid-run failures.
- Run slot-fill script three times with concurrency settings (1, 4, 8). Capture runtime with `/usr/bin/time` or script-run timestamps for cross-checking TOT.
- Tail each generated log to compute average metrics; build a small helper (Node/ts-node) or use `rg` + `jq` to parse `metrics` lines for quantitative comparison.
- Use DEBUG flags to gather per-phase durations. For bottleneck identification, correlate script-level `inlineDurationMs` vs `backgroundDurationMs` vs total; cross-reference Next.js/Supabase logs if accessible.
- After tests, re-run `pnpm run db:stress-test` to confirm integrity; note results in verification along with metrics + recommendations.
