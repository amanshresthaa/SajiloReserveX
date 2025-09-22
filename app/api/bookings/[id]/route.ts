import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { BookingRecord } from "@/server/bookings";
import {
  BOOKING_TYPES,
  buildBookingAuditSnapshot,
  deriveEndTime,
  fetchBookingsForContact,
  findAvailableTable,
  inferMealTypeFromTime,
  logAuditEvent,
  rangesOverlap,
  softCancelBooking,
  updateBookingRecord,
} from "@/server/bookings";
import { BOOKING_BLOCKING_STATUSES, getDefaultRestaurantId, getServiceSupabaseClient } from "@/server/supabase";
import { sendBookingCancellationEmail, sendBookingUpdateEmail } from "@/server/emails/bookings";

const bookingTypeEnum = z.enum(BOOKING_TYPES);

const updateSchema = z.object({
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
  marketingOptIn: z.coerce.boolean().optional().default(false),
});

const contactQuerySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(50),
  restaurantId: z.string().uuid().optional(),
});

function handleZodError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid payload",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

export async function GET(req: NextRequest, context: any) {
  const supabase = getServiceSupabaseClient();
  const params = await context?.params;
  const param = params?.id;
  const bookingId = Array.isArray(param) ? param[0] : param;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id,restaurant_id,table_id,booking_date,start_time,end_time,reference,party_size,booking_type,seating_preference,status,customer_name,customer_email,customer_phone,notes,marketing_opt_in,loyalty_points_awarded,created_at,updated_at")
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch (error: any) {
    console.error("[bookings][GET:id]", error);
    return NextResponse.json({ error: error?.message ?? "Unable to load booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  const params = await context?.params;
  const param = params?.id;
  const bookingId = Array.isArray(param) ? param[0] : param;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  const parsed = updateSchema.safeParse({
    ...body,
    party: Number(body.party ?? 0),
  });

  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const data = parsed.data;
  const supabase = getServiceSupabaseClient();

  try {
    const { data: existing, error } = await supabase
      .from("bookings")
      .select("id,restaurant_id,table_id,booking_date,start_time,end_time,reference,party_size,booking_type,seating_preference,status,customer_name,customer_email,customer_phone,notes,marketing_opt_in,loyalty_points_awarded")
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.customer_email !== data.email || existing.customer_phone !== data.phone) {
      return NextResponse.json({ error: "You can only update your own reservation" }, { status: 403 });
    }

    const restaurantId = data.restaurantId ?? existing.restaurant_id ?? getDefaultRestaurantId();
    const startTime = data.time;
    const normalizedBookingType = data.bookingType === "drinks" ? "drinks" : inferMealTypeFromTime(startTime);
    const endTime = deriveEndTime(startTime, normalizedBookingType);

    // Attempt to reuse the current table when possible
    let nextTableId: string | null = existing.table_id ?? null;

    if (existing.table_id) {
      const { data: currentTable, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("id,capacity,seating_type")
        .eq("id", existing.table_id)
        .maybeSingle();

      if (tableError) {
        throw tableError;
      }

      const tableSupportsParty = currentTable && currentTable.capacity >= data.party;
      const tableMatchesSeating = currentTable && (data.seating === "any" || currentTable.seating_type === data.seating);

      if (tableSupportsParty && tableMatchesSeating) {
        const { data: overlaps, error: overlapsError } = await supabase
          .from("bookings")
          .select("id,start_time,end_time,status")
          .eq("table_id", existing.table_id)
          .eq("booking_date", data.date)
          .in("status", BOOKING_BLOCKING_STATUSES)
          .order("start_time", { ascending: true });

        if (overlapsError) {
          throw overlapsError;
        }

        const hasConflict = (overlaps ?? []).some((entry) => {
          if (entry.id === existing.id) return false;
          return rangesOverlap(entry.start_time, entry.end_time, startTime, endTime);
        });

        if (hasConflict) {
          nextTableId = null;
        }
      } else {
        nextTableId = null;
      }
    }

    if (!nextTableId) {
      const tableRecord = await findAvailableTable(
        supabase,
        restaurantId,
        data.date,
        startTime,
        endTime,
        data.party,
        data.seating,
        existing.id,
      );

      if (!tableRecord) {
        return NextResponse.json(
          { error: "No availability for the requested slot" },
          { status: 409 },
        );
      }

      nextTableId = tableRecord.id;
    }

    const updated = await updateBookingRecord(supabase, bookingId, {
      restaurant_id: restaurantId,
      table_id: nextTableId,
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
      marketing_opt_in: data.marketingOptIn ?? existing.marketing_opt_in,
    });

    await logAuditEvent(supabase, {
      action: "booking.updated",
      entity: "booking",
      entityId: bookingId,
      metadata: {
        restaurant_id: restaurantId,
        ...buildBookingAuditSnapshot(existing as BookingRecord, updated),
      },
    });

    const bookings = await fetchBookingsForContact(supabase, restaurantId, data.email, data.phone);

    try {
      await sendBookingUpdateEmail(updated);
    } catch (error) {
      console.error("[bookings][PUT][email]", error);
    }

    return NextResponse.json({ booking: updated, bookings });
  } catch (error: any) {
    console.error("[bookings][PUT:id]", error);
    return NextResponse.json({ error: error?.message ?? "Unable to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const params = await context?.params;
  const param = params?.id;
  const bookingId = Array.isArray(param) ? param[0] : param;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }
  const parsed = contactQuerySchema.safeParse({
    email: req.nextUrl.searchParams.get("email"),
    phone: req.nextUrl.searchParams.get("phone"),
    restaurantId: req.nextUrl.searchParams.get("restaurantId") ?? undefined,
  });

  if (!parsed.success) {
    return handleZodError(parsed.error);
  }

  const { email, phone, restaurantId } = parsed.data;
  const supabase = getServiceSupabaseClient();

  try {
    const { data: existing, error } = await supabase
      .from("bookings")
      .select("id,restaurant_id,table_id,booking_date,start_time,end_time,reference,party_size,booking_type,seating_preference,status,customer_name,customer_email,customer_phone,notes,marketing_opt_in,loyalty_points_awarded,created_at,updated_at")
      .eq("id", bookingId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.customer_email !== email || existing.customer_phone !== phone) {
      return NextResponse.json({ error: "You can only cancel your own reservation" }, { status: 403 });
    }

    const canceledRecord = await softCancelBooking(supabase, bookingId);

    await logAuditEvent(supabase, {
      action: "booking.canceled",
      entity: "booking",
      entityId: bookingId,
      metadata: {
        restaurant_id: existing.restaurant_id,
        ...buildBookingAuditSnapshot(existing as BookingRecord, canceledRecord),
      },
    });

    const targetRestaurantId = restaurantId ?? existing.restaurant_id ?? getDefaultRestaurantId();
    const bookings = await fetchBookingsForContact(supabase, targetRestaurantId, email, phone);

    try {
      await sendBookingCancellationEmail(canceledRecord);
    } catch (error) {
      console.error("[bookings][DELETE][email]", error);
    }

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("[bookings][DELETE:id]", error);
    return NextResponse.json({ error: error?.message ?? "Unable to cancel booking" }, { status: 500 });
  }
}
