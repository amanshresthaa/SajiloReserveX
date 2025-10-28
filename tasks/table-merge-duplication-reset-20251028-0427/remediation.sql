-- Detect duplicate or conflicting booking table assignments for a specific table or booking.
-- Replace the placeholders with concrete values before running in Supabase.

-- 1. Inspect all assignments for the implicated table.
select booking_id,
       slot_id,
       start_at,
       end_at,
       idempotency_key
from booking_table_assignments
where table_id = 'dc251e72-3193-4f10-8912-d544b684e7e9'
order by start_at nulls last;

-- 2. Surface duplicate ownership of the same table/slot combination.
select table_id,
       slot_id,
       array_agg(booking_id) as booking_ids,
       count(*) as occurrences
from booking_table_assignments
where table_id = 'dc251e72-3193-4f10-8912-d544b684e7e9'
group by table_id, slot_id
having count(*) > 1;

-- 3. Review associated allocations for the booking before cleanup.
select id,
       resource_type,
       resource_id,
       "window"
from allocations
where booking_id = '<booking_id_here>'
  and resource_type in ('table', 'merge_group');

-- 4. Review idempotency ledger entries.
select idempotency_key,
       table_ids,
       assignment_window,
       merge_group_allocation_id
from booking_assignment_idempotency
where booking_id = '<booking_id_here>';

-- 5. Optional: confirm lingering holds for the booking.
select th.id,
       th.zone_id,
       th.start_at,
       th.end_at,
       th.expires_at,
       thm.table_id
from table_holds th
join table_hold_members thm on thm.hold_id = th.id
where th.booking_id = '<booking_id_here>';

-- 6. Cleanup sequence (wrap in BEGIN/COMMIT when executing):
--
-- delete from booking_assignment_idempotency
-- where booking_id = '<booking_id_here>'
--   and idempotency_key = '<stale_key>';
--
-- delete from allocations
-- where booking_id = '<booking_id_here>'
--   and resource_type in ('table','merge_group');
--
-- delete from booking_table_assignments
-- where booking_id = '<booking_id_here>'
--   and table_id = any('{<table_id_1>,<table_id_2>,...}');
--
-- delete from table_hold_members
-- where hold_id in (select id from table_holds where booking_id = '<booking_id_here>');
--
-- delete from table_holds
-- where booking_id = '<booking_id_here>';
--
-- commit;
