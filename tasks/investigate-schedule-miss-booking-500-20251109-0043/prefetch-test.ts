import { fetchReservationSchedule } from '@reserve/features/reservations/wizard/services/schedule';

async function main() {
  const slug = 'white-horse-pub-waterbeach';
  const failures: string[] = [];
  for (let day = 9; day <= 31; day += 1) {
    const date = `2025-11-${String(day).padStart(2, '0')}`;
    try {
      const result = await fetchReservationSchedule(slug, date);
      console.log(date, result.slots.length);
    } catch (error) {
      console.error('fail', date, error);
      failures.push(date);
    }
  }
  console.log('failures', failures);
}

main();
