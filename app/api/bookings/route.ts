import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  BOOKING_TYPES,
  addToWaitingList,
  deriveEndTime,
  fetchBookingsForContact,
  findAvailableTable,
  insertBookingRecord,
  buildBookingAuditSnapshot,
  updateBookingRecord,
  inferMealTypeFromTime,
  logAuditEvent,
  upsertLoyaltyPoints,
} from "@/server/bookings";
import { getDefaultRestaurantId, getServiceSupabaseClient } from "@/server/supabase";

const querySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(50),
  restaurantId: z.string().uuid().optional(),
});

const bookingTypeEnum = z.enum(BOOKING_TYPES);

const bookingSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  party: z.number().int().min(1).max(20),
  bookingType: bookingTypeEnum,
  seating: z.enum(["any", "indoor", "outdoor"]),
  notes: z.string().max(500).optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(50),
});

const LOYALTY_POINTS_PER_GUEST = 5;

function handleZodError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid payload",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const parsedQuery = querySchema.safeParse({
      email: req.nextUrl.searchParams.get("email"),
      phone: req.nextUrl.searchParams.get("phone"),
      restaurantId: req.nextUrl.searchParams.get("restaurantId") ?? undefined,
    });

    if (!parsedQuery.success) {
      return handleZodError(parsedQuery.error);
    }

    const { email, phone, restaurantId } = parsedQuery.data;
    const supabase = getServiceSupabaseClient();
    const targetRestaurantId = restaurantId ?? getDefaultRestaurantId();

    const bookings = await fetchBookingsForContact(supabase, targetRestaurantId, email, phone);

    return NextResponse.json({ bookings });
  } catch (error: unknown) {
    console.error("[bookings][GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  const parsed = bookingSchema.safeParse({
    ...body,
    party: Number(body.party ?? 0),
  });

  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const data = parsed.data;

  try {
    const supabase = getServiceSupabaseClient();
    const restaurantId = data.restaurantId ?? getDefaultRestaurantId();
    const startTime = data.time;
    const normalizedBookingType = data.bookingType === "drinks" ? "drinks" : inferMealTypeFromTime(startTime);
    const endTime = deriveEndTime(startTime, normalizedBookingType);

    const table = await findAvailableTable(
      supabase,
      restaurantId,
      data.date,
      startTime,
      endTime,
      data.party,
      data.seating,
    );

    if (!table) {
      await addToWaitingList(supabase, {
        restaurant_id: restaurantId,
        booking_date: data.date,
        desired_time: startTime,
        party_size: data.party,
        seating_preference: data.seating,
        customer_name: data.name,
        customer_email: data.email,
        customer_phone: data.phone,
        notes: data.notes ?? null,
      });

      await logAuditEvent(supabase, {
        action: "booking.waitlisted",
        entity: "booking",
        metadata: {
          restaurant_id: restaurantId,
          booking_date: data.date,
          desired_time: startTime,
          party_size: data.party,
          seating_preference: data.seating,
          requested_service: normalizedBookingType,
          customer_email: data.email,
        },
      });

      const existing = await fetchBookingsForContact(supabase, restaurantId, data.email, data.phone);

      return NextResponse.json(
        {
          waitlisted: true,
          booking: null,
          bookings: existing,
        },
        { status: 202 },
      );
    }

    const booking = await insertBookingRecord(supabase, {
      restaurant_id: restaurantId,
      table_id: table.id,
      booking_date: data.date,
      start_time: startTime,
      end_time: endTime,
      party_size: data.party,
      booking_type: normalizedBookingType,
      seating_preference: data.seating,
      customer_name: data.name,
      customer_email: data.email,
      customer_phone: data.phone,
      notes: data.notes ?? null,
    });

    const loyaltyAward = Math.max(10, data.party * LOYALTY_POINTS_PER_GUEST);
    await upsertLoyaltyPoints(supabase, data.email, loyaltyAward);

    const finalBooking = await updateBookingRecord(supabase, booking.id, {
      loyalty_points_awarded: loyaltyAward,
    });

    await logAuditEvent(supabase, {
      action: "booking.created",
      entity: "booking",
      entityId: booking.id,
      metadata: {
        restaurant_id: restaurantId,
        table_id: table.id,
        ...buildBookingAuditSnapshot(null, finalBooking),
      },
    });

    const bookings = await fetchBookingsForContact(supabase, restaurantId, data.email, data.phone);

    return NextResponse.json(
      {
        booking: finalBooking,
        table,
        loyaltyPointsAwarded: loyaltyAward,
        bookings,
        waitlisted: false,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[bookings][POST]", error);

    return NextResponse.json(
      { error: error?.message ?? "Unable to create booking" },
      { status: 500 },
    );
  }
}
