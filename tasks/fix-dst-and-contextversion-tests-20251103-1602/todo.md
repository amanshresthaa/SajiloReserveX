# Implementation Checklist

- [ ] Add DST gap coercion in windowsOverlap normalization.
- [ ] Patch manualAssignmentRoutes tests to include contextVersion and mock context getter.
- [ ] Run ops tests and adjust if needed.

## Notes

- Coercion only applied when Luxon DateTime invalid to minimize impact.
