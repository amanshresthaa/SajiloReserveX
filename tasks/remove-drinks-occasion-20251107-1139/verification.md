# Verification Report

## Data Verification

- [x] `booking_occasions` query shows `drinks` inactive (`psql "$SUPABASE_DB_URL" -c "select key, label, is_active from booking_occasions where key = 'drinks';"` returned `f`).
- [x] `restaurant_service_periods` query returns no `drinks` rows (global scan by `booking_option = 'drinks'`).

## API / Schedule Check

- [ ] Schedule endpoint response inspected and confirmed to omit `drinks` (blocked—no schedule client available in CLI session; data fix should propagate automatically on next fetch).

## Linting Verification

- [x] `pnpm lint` (passes; eslint over capacity modules) to satisfy bug-fix linting requirement.

## Notes

- Pending schedule smoke test once API client access is available.
