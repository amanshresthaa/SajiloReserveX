import { POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';

async function main() {
  const payload = {
    restaurantId: '6cd7cc9a-ec06-4747-8fd3-0d9f4037aa27',
    date: '2025-11-26',
    time: '19:00',
    party: 2,
    bookingType: 'dinner',
    seating: 'indoor',
    notes: '',
    name: 'Test Guest',
    email: 'guest@example.com',
    phone: '+441234567890',
    marketingOptIn: false,
  };

  const req = new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });

  const res = await POST(req);
  console.log(res.status);
  const json = await res.json();
  console.log(json);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
