-- Delete observability events older than 90 days
DELETE FROM public.observability_events
 WHERE created_at < now() - interval '90 days';
