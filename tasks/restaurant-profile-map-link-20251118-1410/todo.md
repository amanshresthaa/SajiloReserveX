---
task: restaurant-profile-map-link
timestamp_utc: 2025-11-18T14:10:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: medium
flags: []
related_tickets: []
---

# Implementation Checklist

## Setup

- [x] Add Supabase migration for `google_map_url` on restaurants
- [ ] Update types to include new column

## Core

- [ ] Extend REST schemas/services and select fields to carry `googleMapUrl`
- [ ] Update restaurant update logic to persist map link
- [ ] Update booking email venue resolver/types to include map link

## UI/UX

- [ ] Add Google Maps link input to Restaurant Profile form (validation, helper text)
- [ ] Wire initial values and payload in `RestaurantProfileSection`
- [ ] Render map link in booking emails when present

## Tests

- [ ] Manual regression: save profile with/without link, verify payload and stored data
- [ ] Email preview/manual check for link rendering

## Notes

- Assumptions: Map link is optional; any valid absolute URL acceptable.
- Deviations: None yet.
