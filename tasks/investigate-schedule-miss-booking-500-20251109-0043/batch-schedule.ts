import { fetchReservationSchedule } from '@reserve/features/reservations/wizard/services/schedule';

async function runBatch(label: string, dates: string[]) {
  const results = await Promise.allSettled(
    dates.map(async (date) => {
      const data = await fetchReservationSchedule('white-horse-pub-waterbeach', date);
      return { date, slots: data.slots.length };
    }),
  );
  console.log(label, results);
}

async function main() {
  const novDates = Array.from({ length: 30 }, (_, idx) => `2025-11-${String(idx + 1).padStart(2, '0')}`);
  await runBatch('nov', novDates);
}

main();
