# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] Validate/Hold/Confirm requests include `contextVersion`.
- [ ] `STALE_CONTEXT` and `POLICY_CHANGED` surfaced with details.

## Test Outcomes

- [ ] Policy drift causes confirm to fail with `POLICY_CHANGED`.
- [ ] Stale context rejected with `STALE_CONTEXT` and actionable prompt.

## Sign‑off

- [ ] Engineering
