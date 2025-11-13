import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('table_hold_windows')
    .select('hold_id, table_id, start_at, end_at, expires_at, restaurant_id, booking_id')
    .gte('start_at', '2025-11-26T00:00:00Z')
    .lte('start_at', '2025-11-26T23:59:59Z');
  if (error) {
    console.error('error', error);
    process.exit(1);
  }
  console.log('windows', data?.length ?? 0);
  data?.forEach((row) => console.log(row));
}

main();
