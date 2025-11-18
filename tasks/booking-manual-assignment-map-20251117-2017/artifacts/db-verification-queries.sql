-- ============================================================================
-- DATABASE MIGRATION VERIFICATION QUERIES
-- ============================================================================
-- Date: 2025-11-17
-- Environment: Production Remote Supabase
-- Project: mqtchcaavsucsdjskptc
-- Database: aws-1-eu-north-1.pooler.supabase.com:6543
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFY MIGRATION STATUS
-- ----------------------------------------------------------------------------

-- Check which migrations have been applied (via Supabase CLI)
-- Command: supabase migration list --linked
-- Result: All 83 migrations applied, including:
--   - 20251114140643_allocator_backtracking_and_merge_graph
--   - 20251116_fix_unassign_tables_atomic

-- ----------------------------------------------------------------------------
-- 2. VERIFY table_merge_graph TABLE
-- ----------------------------------------------------------------------------

-- Check table exists
\dt public.table_merge_graph;

-- Expected Result:
-- Schema |       Name        | Type  |  Owner   
-- --------+-------------------+-------+----------
-- public | table_merge_graph | table | postgres

-- Check table structure and indexes
\d public.table_merge_graph;

-- Expected Columns:
--   restaurant_id (uuid, NOT NULL)
--   table_a (uuid, NOT NULL)
--   table_b (uuid, NOT NULL)
--   merge_score (integer, default 0)
--   notes (text)
--   created_at (timestamptz, NOT NULL, default now())
--   updated_at (timestamptz, NOT NULL, default now())

-- Expected Indexes:
--   table_merge_graph_pk (PRIMARY KEY)
--   table_merge_graph_restaurant_idx
--   table_merge_graph_reverse_idx

-- Expected Foreign Keys:
--   table_merge_graph_restaurant_id_fkey → restaurants(id)
--   table_merge_graph_table_a_fkey → table_inventory(id)
--   table_merge_graph_table_b_fkey → table_inventory(id)

-- Verify table structure details
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'table_merge_graph'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'table_merge_graph'
ORDER BY indexname;

-- ----------------------------------------------------------------------------
-- 3. VERIFY unassign_tables_atomic FUNCTION
-- ----------------------------------------------------------------------------

-- List function with signature
\df public.unassign_tables_atomic;

-- Expected Result:
-- Schema |          Name          |   Result data type   |                    Argument data types                     
-- --------+------------------------+----------------------+------------------------------------------------------------
-- public | unassign_tables_atomic | TABLE(table_id uuid) | p_booking_id uuid, p_table_ids uuid[] DEFAULT NULL::uuid[]

-- Verify function exists in information_schema
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'unassign_tables_atomic';

-- Get function parameters
SELECT 
  parameter_name,
  data_type,
  parameter_mode,
  parameter_default
FROM information_schema.parameters
WHERE specific_schema = 'public' 
  AND specific_name LIKE 'unassign_tables_atomic%'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 4. VERIFY allocations TABLE UPDATES
-- ----------------------------------------------------------------------------

-- Verify restaurant_id column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'allocations'
  AND column_name = 'restaurant_id';

-- Expected Result:
--  column_name  | data_type | is_nullable | column_default
-- --------------+-----------+-------------+----------------
-- restaurant_id | uuid      | NO          | 

-- Verify all indexes on allocations
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'allocations'
ORDER BY indexname;

-- Expected Indexes (9 total):
--   allocations_booking_id_idx
--   allocations_booking_resource_key (UNIQUE)
--   allocations_no_overlap (GIST with WHERE clause)
--   allocations_pkey (PRIMARY KEY)
--   allocations_resource_idx
--   allocations_restaurant_id_idx
--   allocations_window_gist_idx (GIST)
--   idx_allocations_restaurant
--   idx_allocations_window_gist (GIST)

-- Check GIST index specifically for overlap detection
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'allocations'
  AND indexdef LIKE '%gist%'
ORDER BY indexname;

-- ----------------------------------------------------------------------------
-- 5. VERIFICATION SUMMARY QUERY
-- ----------------------------------------------------------------------------

-- Check all related objects exist
SELECT 
  'table_merge_graph_table' AS object_type,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'table_merge_graph'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status

UNION ALL

SELECT 
  'unassign_tables_atomic_function' AS object_type,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'unassign_tables_atomic'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status

UNION ALL

SELECT 
  'allocations_restaurant_id_column' AS object_type,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'allocations' 
      AND column_name = 'restaurant_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status

UNION ALL

SELECT 
  'table_merge_graph_pk_index' AS object_type,
  CASE WHEN EXISTS(
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'table_merge_graph'
      AND indexname = 'table_merge_graph_pk'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status

UNION ALL

SELECT 
  'allocations_no_overlap_gist' AS object_type,
  CASE WHEN EXISTS(
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'allocations'
      AND indexname = 'allocations_no_overlap'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

-- Expected Result: All should show '✅ EXISTS'

-- ----------------------------------------------------------------------------
-- 6. EXECUTION COMMANDS (via psql)
-- ----------------------------------------------------------------------------

-- Connection command (replace password):
-- PGPASSWORD='your_password' psql \
--   -h aws-1-eu-north-1.pooler.supabase.com \
--   -p 6543 \
--   -U postgres.mqtchcaavsucsdjskptc \
--   -d postgres

-- Or use connection string:
-- psql "postgresql://postgres.mqtchcaavsucsdjskptc:PASSWORD@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

-- Run single query:
-- PGPASSWORD='...' psql -h ... -p ... -U ... -d postgres -c "YOUR_QUERY_HERE"

-- Run script file:
-- PGPASSWORD='...' psql -h ... -p ... -U ... -d postgres -f verify_migrations.sql

-- ============================================================================
-- VERIFICATION RESULTS (2025-11-17)
-- ============================================================================

-- All checks passed ✅
-- table_merge_graph: VERIFIED
-- unassign_tables_atomic: VERIFIED
-- allocations updates: VERIFIED
-- All indexes: VERIFIED

-- Total migrations: 83/83 applied
-- Status: PRODUCTION READY

-- ============================================================================
