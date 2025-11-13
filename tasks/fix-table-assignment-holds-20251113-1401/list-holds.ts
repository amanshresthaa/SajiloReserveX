import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const supabase = getServiceSupabaseClient();
  const restaurantId = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID;
  if (!restaurantId) {
    throw new Error('NEXT_PUBLIC_DEFAULT_RESTAURANT_ID must be set');
  }
  const { data, error } = await supabase
    .from('table_holds')
    .select('id, restaurant_id, booking_id, start_at, end_at, expires_at, created_at')
    .eq('restaurant_id', restaurantId)
    .order('start_at', { ascending: true });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('holds', data?.length ?? 0);
  data?.forEach((row) => {
    console.log(row.id, row.start_at, row.end_at, row.expires_at, row.booking_id);
  });
}

main();
