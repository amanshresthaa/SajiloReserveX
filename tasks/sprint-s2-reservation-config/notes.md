# Notes — S2 Reservation Config

- `reservationConfigResult.issues` now surfaces validation problems without throwing. Downstream stories can tap this to feed logging/telemetry once DI layer lands (S7).
- Booking helpers and legacy helpers pull window data from the shared config; when S4 decomposes helpers, ensure they re-export the same utilities to avoid drift.
- Happy hour remains weekday-only. If product introduces weekend variants, expand config schema by adding explicit weekend happy hour range.
- Tooltip copy comes from config—localise via config or translation layer in future sprint.
