# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP (to be executed during ops UI session)

### Console & Network

- [ ] No Console errors on manual assignment tab
- [ ] Network requests match contracts (validate, hold, confirm)
- [ ] Performance warnings addressed (notes)

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible indicators
- [ ] Keyboard-only flows succeed

### Performance (profiled)

- FCP: <value> s
- LCP: <value> s
- CLS: <value>
  Notes: ...

### Device Emulation

- [ ] Mobile (≈375px)
- [ ] Tablet (≈768px)
- [ ] Desktop (≥1280px)

## Test Outcomes

- [ ] Happy path (validate → hold → confirm)
- [ ] Hold conflict handling (409 → re-validate)
- [ ] Cross-zone selection error
- [ ] Adjacency enforcement error (when enabled)
- [ ] Direct assign/unassign flows

## Known Issues

- [ ] <issue> (owner, priority)

## Sign‑off

- [ ] Engineering
- [ ] Design/PM

## MCP Pre‑Flight

- [ ] Server reachable (version printed)
- [ ] Session token valid (if required)
- [ ] Secrets via env (not logged)
- [ ] Target environment confirmed (staging/prod)
