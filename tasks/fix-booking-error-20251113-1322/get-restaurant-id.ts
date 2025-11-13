import { getRestaurantBySlug } from '@/server/restaurants';

async function main() {
  const restaurant = await getRestaurantBySlug('white-horse-pub-waterbeach');
  console.log(restaurant);
}

main().catch((error) => {
  console.error('error', error);
  process.exit(1);
});
