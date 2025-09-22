# Observability Guardrails

Sprint 0 introduced a minimal telemetry spine so the team can watch the critical hotfixes:

## 1. Data Sources

- `stripe_events`: stores the raw webhook payload and processing status (`processed`, `ignored`, `failed`). Use it to build a replay queue or health chart.
- `observability_events`: lightweight event log for API failures. Columns:
  - `source`: subsystem (e.g. `api.bookings`, `api.stripe-webhook`)
  - `event_type`: semantic event name (`booking.create.failure`, `stripe.event.processing_failed`, etc.)
  - `severity`: `info | warning | error | critical`
  - `context`: JSON blob with scrubbed metadata (no PII—only domain/suffix).

## 2. Dashboards

Create a Supabase Saved Query or connect the database to Grafana / Metabase.

Example queries:

```sql
-- Booking API error volume (last 24h)
select date_trunc('hour', created_at) as hour,
       count(*)
  from observability_events
 where source = 'api.bookings'
   and severity in ('error','critical')
   and created_at > now() - interval '24 hours'
 group by 1
 order by 1;
```

```sql
-- Stripe webhook failure drilldown
select event_type,
       context ->> 'eventId' as event_id,
       context ->> 'message' as message,
       created_at
  from observability_events
 where source = 'api.stripe-webhook'
   and severity = 'critical'
 order by created_at desc
 limit 50;
```

## 3. Alerts

Recommended wiring (run book in `docs/oncall.md` if you have one):

1. **Supabase → Slack**: use [Supabase Webhooks](https://supabase.com/docs/guides/database/webhooks) on `observability_events` for `severity IN ('error','critical')`. Send payloads to `#oncall`.
2. **Stripe events**: configure a SQL trigger to raise an event when `stripe_events.status = 'failed'`. Notify via the same webhook.
3. **Secret scanners**: `.github/workflows/secret-scanning.yml` now posts status to the GitHub job summary. Enable the [Actions → Required status checks] to block merges until the job is green.

## 4. Operating Tips

- **Triaging booking 5xx**: filter `observability_events` by `event_type = 'booking.create.failure'` to grab the time window, then cross-reference with Vercel logs.
- **Stripe duplicate noise**: duplicates are logged as `severity='warning'`. Large spikes hint at retry storms (check endpoint latency).
- **Retention**: plan to purge `observability_events` > 90 days old (see `scripts/maintenance/purge-observability.sql` placeholder).

## 5. Follow-up

- Add dashboards to whichever BI tool the team already uses (Looker, Metabase, Grafana).
- Consider shipping metrics to an APM (Datadog, New Relic) once budget approves.
- Backfill legacy errors by replaying Nginx / Vercel logs into `observability_events` if you need historic data for trend lines.
