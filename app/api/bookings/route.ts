import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  BOOKING_TYPES,
  SEATING_OPTIONS,
  deriveEndTime,
  fetchBookingsForContact,
  findAvailableTable,
  insertBookingRecord,
  buildBookingAuditSnapshot,
  updateBookingRecord,
  inferMealTypeFromTime,
  logAuditEvent,
  upsertLoyaltyPoints,
  generateUniqueBookingReference,
  addToWaitingList,
} from "@/server/bookings";
import type { BookingRecord } from "@/server/bookings";
import { getDefaultRestaurantId, getServiceSupabaseClient } from "@/server/supabase";
import { sendBookingConfirmationEmail } from "@/server/emails/bookings";
import { recordObservabilityEvent } from "@/server/observability";

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
  seating: z.enum(SEATING_OPTIONS),
  notes: z.string().max(500).optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(50),
  marketingOptIn: z.coerce.boolean().optional().default(false),
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
  const restaurantId = data.restaurantId ?? getDefaultRestaurantId();

  try {
    const supabase = getServiceSupabaseClient();
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

    const allocationPending = !table;
    const bookingStatus = allocationPending ? "pending_allocation" : "confirmed";
    let waitlisted = false;

    let booking: BookingRecord | null = null;
    let reference = "";

    for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
      reference = await generateUniqueBookingReference(supabase);

      try {
        booking = await insertBookingRecord(supabase, {
          restaurant_id: restaurantId,
          table_id: table?.id ?? null,
          booking_date: data.date,
          start_time: startTime,
          end_time: endTime,
          reference,
          party_size: data.party,
          booking_type: normalizedBookingType,
          seating_preference: data.seating,
          status: bookingStatus,
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone,
          notes: data.notes ?? null,
          marketing_opt_in: data.marketingOptIn ?? false,
        });
      } catch (error: any) {
        const duplicateReference = error?.code === "23505" || /duplicate key value/.test(error?.message ?? "");
        if (!duplicateReference) {
          throw error;
        }
        booking = null;
      }
    }

    if (!booking) {
      throw new Error("Unable to allocate a booking reference. Please try again.");
    }

    let finalBooking = booking;
    let loyaltyAward = 0;

    if (allocationPending) {
      try {
        waitlisted = await addToWaitingList(supabase, {
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
      } catch (error) {
        console.error("[bookings][POST][waitlist] Failed to add to waitlist", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      loyaltyAward = Math.max(10, data.party * LOYALTY_POINTS_PER_GUEST);
      await upsertLoyaltyPoints(supabase, data.email, loyaltyAward);

      finalBooking = await updateBookingRecord(supabase, booking.id, {
        loyalty_points_awarded: loyaltyAward,
      });
      waitlisted = false;
    }

    await logAuditEvent(supabase, {
      action: "booking.created",
      entity: "booking",
      entityId: booking.id,
      metadata: {
        restaurant_id: restaurantId,
        table_id: table?.id ?? null,
        reference: finalBooking.reference,
        waitlisted,
        allocation_pending: allocationPending,
        ...buildBookingAuditSnapshot(null, finalBooking),
      },
    });

    const bookings = await fetchBookingsForContact(supabase, restaurantId, data.email, data.phone);

    if (!allocationPending) {
      try {
        console.log(`[bookings][POST][email] Sending confirmation email to: ${finalBooking.customer_email} for booking: ${finalBooking.reference}`);
        await sendBookingConfirmationEmail(finalBooking);
        console.log(`[bookings][POST][email] Successfully sent confirmation email for booking: ${finalBooking.reference}`);
      } catch (error) {
        console.error("[bookings][POST][email] Failed to send confirmation email:", {
          bookingId: finalBooking.id,
          reference: finalBooking.reference,
          customerEmail: finalBooking.customer_email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    return NextResponse.json(
      {
        booking: finalBooking,
        table: table ?? null,
        loyaltyPointsAwarded: loyaltyAward,
        bookings,
        waitlisted,
        allocationPending,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[bookings][POST]", error);

    const emailDomain = data.email.includes("@") ? data.email.split("@")[1] : null;
    const phoneSuffix = data.phone ? data.phone.slice(-4) : null;

    void recordObservabilityEvent({
      source: "api.bookings",
      eventType: "booking.create.failure",
      severity: "error",
      context: {
        message: error?.message ?? "Unknown error",
        restaurantId,
        bookingDate: data.date,
        emailDomain,
        phoneSuffix,
      },
    });

    return NextResponse.json(
      { error: error?.message ?? "Unable to create booking" },
      { status: 500 },
    );
  }
}
