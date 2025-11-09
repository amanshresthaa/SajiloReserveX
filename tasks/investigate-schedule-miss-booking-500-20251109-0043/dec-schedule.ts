import { fetchReservationSchedule } from '@reserve/features/reservations/wizard/services/schedule';

async function main() {
  for (let day = 1; day <= 31; day += 1) {
    const date = `2025-12-${String(day).padStart(2, '0')}`;
    try {
      const res = await fetchReservationSchedule('white-horse-pub-waterbeach', date);
      console.log(date, res.slots.length);
    } catch (error) {
      console.error('fail', date, error);
    }
  }
}

main();
