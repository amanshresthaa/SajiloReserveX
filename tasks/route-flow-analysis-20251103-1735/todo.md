# Implementation Checklist

## Core

- [ ] Decide `/thank-you` model (auth-gated vs token deep-link)
- [ ] Update wizard to pass `confirmationToken` (if token deep-link chosen)
- [ ] Add E2E: wizard Close → `/thank-you`

## Tests

- [ ] Fix `/ops/settings` → `/ops/restaurant-settings` in E2E specs
- [ ] Adjust selectors for team and walk‑in suites
- [ ] Add smoke tests: `/blog`, `/blog/*`, `/browse`, `/pricing`, `/privacy-policy`, `/tos`

## Notes

- Assumptions: No behavior change shipped without flag
- Deviations: Analysis only in this task
