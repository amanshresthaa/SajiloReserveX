import { getRestaurantBySlug } from '@/server/restaurants';
import { getInitialDetails } from '@/reserve/features/reservations/wizard/model/reducer';

async function main() {
  const restaurant = await getRestaurantBySlug('white-horse-pub-waterbeach');
  if (!restaurant) {
    console.error('Restaurant missing');
    process.exit(1);
  }
  const details = getInitialDetails({
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    restaurantTimezone: restaurant.timezone,
  });
  console.log('restaurantId', details.restaurantId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
