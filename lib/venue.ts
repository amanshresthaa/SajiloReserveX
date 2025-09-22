export type VenueDetails = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  policy: string;
  timezone: string;
};

export const DEFAULT_RESTAURANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ?? "f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68";

export const DEFAULT_VENUE: VenueDetails = {
  id: DEFAULT_RESTAURANT_ID,
  name: "SajiloReserveX Test Kitchen",
  address: "12 Market Row, London SE1 0AA",
  phone: "+44 20 1234 5678",
  email: "reservations@SajiloReserveX.co.uk",
  policy:
    "You can cancel or amend up to 24 hours before your reservation. After that window please call the venue and we’ll do our best to help.",
  timezone: "Europe/London",
};
