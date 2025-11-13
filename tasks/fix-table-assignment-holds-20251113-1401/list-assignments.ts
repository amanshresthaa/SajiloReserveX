import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const supabase = getServiceSupabaseClient();
  const restaurantId = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID;
  if (!restaurantId) {
    throw new Error('NEXT_PUBLIC_DEFAULT_RESTAURANT_ID must be set');
  }
  const { data, error } = await supabase
    .from('booking_table_assignments')
    .select('booking_id, table_id, start_at, end_at, bookings!inner(restaurant_id)')
    .eq('bookings.restaurant_id', restaurantId)
    .gte('start_at', '2025-11-26T00:00:00Z')
    .lte('start_at', '2025-11-26T23:59:59Z');
  if (error) {
    console.error('error', error);
    process.exit(1);
  }
  console.log('assignments', data?.length ?? 0);
  data?.forEach((row) => console.log(row));
}

main();
