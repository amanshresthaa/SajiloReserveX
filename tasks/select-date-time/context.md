# Context: Select Date & Time

- Date and time now sit side-by-side in rounded selectors: the time button opens a popover list of slots (30-minute increments from configurable `RESERVATION_CONFIG` 12:00–23:00 window). Each item shows the formatted time plus a badge label (Lunch, Dinner, Happy Hour, Drinks only) and respects the availability rules.
- Happy Hour badge and kitchen-closed alert render directly beneath the date/time row when the selection qualifies.
- Service toggles live inside the “Additional preferences” accordion, with disabled options wrapped in tooltips and a helper message for drinks-only slots.
- Guests counter remains compact with +/- buttons and aria-live feedback.
