# Implementation Checklist

- [x] Fix `escapeHtml` regex in `server/emails/base.ts` (no-useless-escape)
- [x] Replace unnecessary escaped quotes in `server/emails/bookings.ts` (guest/venue/support blocks)
- [x] Remove unused import `DEFAULT_VENUE`
- [x] Neutralize `renderHtml` unused warning
- [ ] Verify ESLint passes locally
