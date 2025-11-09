import { getRestaurantSchedule } from '@/server/restaurants/schedule';
import { getRestaurantBySlug } from '@/server/restaurants/getRestaurantBySlug';

async function main() {
  const restaurant = await getRestaurantBySlug('white-horse-pub-waterbeach');
  if (!restaurant) {
    console.error('restaurant missing');
    process.exit(1);
  }
  const schedule = await getRestaurantSchedule(restaurant.id, { date: '2025-12-05' });
  console.log('slots', schedule.slots.length, 'isClosed', schedule.isClosed);
}

main();
