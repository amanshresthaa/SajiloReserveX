# Verification Report

## Manual QA — Chrome DevTools (MCP)

Tool: Chrome DevTools MCP

### Console & Network

- [ ] No Console errors
- [ ] `GET /api/staff/manual/context` returns 422 with `{ code: "SERVICE_OVERRUN" }` for overrun booking
- [ ] Other bookings continue to 200

### DOM & Accessibility

- [ ] Error surfaces readably; focus management intact

### Device Emulation

- [ ] Mobile/Tablet/Desktop ok

## Test Outcomes

- [ ] Typecheck passes

## Known Issues

- [ ] Adjacency asymmetry warnings observed; tracked separately

## Sign-off

- [ ] Engineering
