# Implementation Checklist

- [x] Prefill NEXT*PUBLIC*\* URLs from Vercel env in `lib/env.ts`.
- [x] Adjust production schema to conditional Resend requirements.
- [x] Update `.env.local.example` with `NEXT_PUBLIC_APP_URL`.
- [x] Update onboarding doc with derivation + rules.
- [ ] Verify build on Vercel.

## Notes

- Assumptions: Email may be disabled on previews; runtime guards prevent sending.
- Deviations: None.
