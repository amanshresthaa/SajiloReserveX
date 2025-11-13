import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const supabase = getServiceSupabaseClient();
  const restaurantId = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID;
  if (!restaurantId) {
    throw new Error('NEXT_PUBLIC_DEFAULT_RESTAURANT_ID must be set');
  }
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, party_size, status, restaurant_id')
    .eq('restaurant_id', restaurantId)
    .eq('booking_date', '2025-11-26');
  if (error) throw error;
  console.log('bookings', data?.length ?? 0);
}

main();
