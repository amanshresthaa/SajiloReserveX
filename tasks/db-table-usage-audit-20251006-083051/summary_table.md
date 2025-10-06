| Table Name           | Usage Count | Top Files                                                                                       | Operations             | Status    |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------------- | ---------------------- | --------- |
| bookings             | 23          | app/api/bookings/[id]/route.ts, server/bookings.ts, scripts/db/backfill-customers-loyalty.sql   | INSERT, SELECT, UPDATE | ✅ Active |
| profiles             | 11          | app/api/webhook/stripe/route.ts, lib/profile/server.ts, app/api/stripe/create-checkout/route.ts | INSERT, SELECT, UPDATE | ✅ Active |
| waiting_list         | 6           | server/bookings.ts                                                                              | INSERT, SELECT, UPDATE | ✅ Active |
| customers            | 6           | server/customers.ts, app/api/test/bookings/route.ts                                             | INSERT, SELECT, UPDATE | ✅ Active |
| stripe_events        | 4           | app/api/webhook/stripe/route.ts                                                                 | INSERT, SELECT, UPDATE | ✅ Active |
| loyalty_points       | 4           | database/database.sql, server/loyalty.ts                                                        | INSERT, SELECT, UPDATE | ✅ Active |
| customer_profiles    | 4           | server/customers.ts                                                                             | INSERT, SELECT         | ✅ Active |
| restaurant_tables    | 3           | app/api/bookings/[id]/route.ts, server/bookings.ts                                              | SELECT                 | ✅ Active |
| loyalty_point_events | 3           | database/database.sql, server/loyalty.ts                                                        | INSERT, UPDATE         | ✅ Active |
| restaurants          | 2           | server/supabase.ts                                                                              | SELECT                 | ✅ Active |
| leads                | 2           | app/api/lead/route.ts, app/api/test/leads/route.ts                                              | DELETE, INSERT, SELECT | ✅ Active |
| audit_logs           | 2           | server/bookingHistory.ts, server/bookings.ts                                                    | INSERT, SELECT         | ✅ Active |
| observability_events | 1           | server/observability.ts                                                                         | INSERT                 | ✅ Active |
| loyalty_programs     | 1           | server/loyalty.ts                                                                               | SELECT                 | ✅ Active |
| booking_versions     | 1           | server/bookingHistory.ts                                                                        | SELECT                 | ✅ Active |
| analytics_events     | 1           | server/analytics.ts                                                                             | INSERT                 | ✅ Active |
| reviews              | 0           | -                                                                                               | -                      | ❌ Unused |
| restaurant_areas     | 0           | -                                                                                               | -                      | ❌ Unused |
| availability_rules   | 0           | -                                                                                               | -                      | ❌ Unused |
