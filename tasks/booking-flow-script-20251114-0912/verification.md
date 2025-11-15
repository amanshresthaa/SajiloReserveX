---
task: booking-flow-script
timestamp_utc: 2025-11-14T21:23:39Z
owner: github:@ai-agent
reviewers: []
risk: high
flags: []
related_tickets: []
---

# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] Network requests match contract

### DOM & Accessibility

- [ ] Semantic HTML verified
- [ ] ARIA attributes correct
- [ ] Focus order logical & visible
- [ ] Keyboard-only flows succeed

### Performance (profiled; mobile; 4× CPU; 4G)

- FCP: _n/a_ | LCP: _n/a_ | CLS: _n/a_ | TBT: _n/a_
- Budgets met: [ ] Yes [x] No — Blocked before UI verification; CLI flow failed prior to page interaction.

### Device Emulation

- [ ] Mobile (≈375px) [ ] Tablet (≈768px) [ ] Desktop (≥1280px)

## Test Outcomes

- [x] Booking flow stress script invoked with live API target (`pnpm booking:flow --restaurant-slug white-horse-pub-waterbeach --date 2026-07-05 --time 12:00 --stress --pretty --timeout-ms 180000`).
- [ ] Happy path completed against live API — **Blocked** because `api.sajiloreservex.com` cannot be resolved from this environment (`curl` and node `fetch` throw `getaddrinfo ENOTFOUND`), so the run aborts before Supabase diagnostics.
- [x] Local stress run (base URL `http://localhost:3000`) executed with `--stress --stress-max 40 --timeout-ms 180000`. Six sequential bookings for 2026‑07‑05 12:00 confirmed inline (tables D7 → D8 → G1 → G2 → G3 → D4). The 7th attempt timed out after background auto-assign because no further tables were available for that window, so the script halted with `failed_background_timeout`.
- [ ] Error handling verified for live API (blocked upstream)
- [ ] A11y (axe): _not executed_

## Artifacts

- Live-host failure logs: `tasks/booking-flow-script-20251114-0912/artifacts/booking-flow-stress-20251114T212107Z.log`, `tasks/booking-flow-script-20251114-0912/artifacts/booking-flow-stress-20251114T213058Z.log`
- Local stress log (base URL `http://localhost:3000`): `tasks/booking-flow-script-20251114-0912/artifacts/booking-flow-stress-20251114T213800Z.log`
- Slot sweep logs (2026-07-05):
  - `12:15` — `booking-flow-stress-2026-07-05-12-15-20251114T214949Z.log`
  - `12:30` — `booking-flow-stress-2026-07-05-12-30-20251114T220007Z.log`
  - `12:45` — `booking-flow-stress-2026-07-05-12-45-20251114T215612Z.log`
  - `13:00` — `booking-flow-stress-2026-07-05-13-00-20251114T215922Z.log`
  - `13:30` — `booking-flow-stress-2026-07-05-13-30-20251114T220350Z.log`, `booking-flow-stress-2026-07-05-13-30-20251114T220850Z.log`
  - `13:45` — `booking-flow-stress-2026-07-05-13-45-20251114T222026Z.log`
  - `15:00` — `booking-flow-stress-2026-07-05-15-00-20251114T222347Z.log`
- Booking snapshot (DB query): `tasks/booking-flow-script-20251114-0912/artifacts/booking-capacity-2026-07-05-12-00-15-00.txt`
- Earlier local runs (for comparison): `tasks/booking-flow-script-20251114-0912/artifacts/booking-flow-stress-20251114T210017Z.log`, `booking-flow-stress-20251114T205344Z.log`, `booking-flow-stress-20251114T205125Z.log`

## Known Issues

- [x] Cannot reach `https://api.sajiloreservex.com` from the CLI host (`curl` returns `Could not resolve host`). Requires DNS/VPN configuration before we can collect live-API verification evidence.
- [x] Local stress run halts once tables are exhausted for the 12:00 slot (7th run timed out after background auto-assign when no capacity remained). Further verification needs either a reset of table capacity or a different slot/party mix if the goal is “fill every table”.

## Sign-off

- [ ] Engineering
- [ ] Design/PM
- [ ] QA
