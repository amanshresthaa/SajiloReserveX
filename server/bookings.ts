import type { SupabaseClient } from "@supabase/supabase-js";

import { BOOKING_BLOCKING_STATUSES } from "@/server/supabase";

export type TableRecord = {
  id: string;
  label: string;
  capacity: number;
  seating_type: string;
  features: string[] | null;
};

export type BookingRecord = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  booking_type: string;
  seating_preference: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  loyalty_points_awarded: number;
  created_at: string;
  updated_at: string;
};

const TABLE_SELECT = "id,label,capacity,seating_type,features";
const BOOKING_SELECT = "id,restaurant_id,table_id,booking_date,start_time,end_time,party_size,booking_type,seating_preference,status,customer_name,customer_email,customer_phone,notes,loyalty_points_awarded,created_at,updated_at";

export const BOOKING_TYPES = ["lunch", "dinner", "drinks"] as const;
export const SEATING_OPTIONS = ["any", "indoor", "outdoor"] as const;

const AUDIT_BOOKING_FIELDS: Array<keyof BookingRecord> = [
  "restaurant_id",
  "table_id",
  "booking_date",
  "start_time",
  "end_time",
  "party_size",
  "booking_type",
  "seating_preference",
  "status",
  "customer_name",
  "customer_email",
  "customer_phone",
  "notes",
  "loyalty_points_awarded",
];

function pickBookingFields(source: Partial<BookingRecord> | null | undefined) {
  if (!source) return null;
  const picked: Partial<Record<keyof BookingRecord, unknown>> = {};
  for (const field of AUDIT_BOOKING_FIELDS) {
    if (field in source) {
      picked[field] = source[field] ?? null;
    }
  }
  return picked;
}

export function buildBookingAuditSnapshot(
  previous: Partial<BookingRecord> | null | undefined,
  current: Partial<BookingRecord> | null | undefined,
): {
  previous: Partial<Record<keyof BookingRecord, unknown>> | null;
  current: Partial<Record<keyof BookingRecord, unknown>> | null;
  changes: Array<{ field: keyof BookingRecord; before: unknown; after: unknown }>;
} {
  const prev = pickBookingFields(previous);
  const curr = pickBookingFields(current);
  const changes: Array<{ field: keyof BookingRecord; before: unknown; after: unknown }> = [];

  for (const field of AUDIT_BOOKING_FIELDS) {
    const before = prev ? prev[field] ?? null : null;
    const after = curr ? curr[field] ?? null : null;
    const changed = Array.isArray(before) || Array.isArray(after)
      ? JSON.stringify(before) !== JSON.stringify(after)
      : before !== after;
    if (changed) {
      changes.push({ field, before, after });
    }
  }

  return { previous: prev, current: curr, changes };
}

export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map((value) => Number(value) || 0);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function calculateDurationMinutes(bookingType: string): number {
  switch (bookingType) {
    case "drinks":
      return 75;
    case "lunch":
      return 90;
    default:
      return 120;
  }
}

export function inferMealTypeFromTime(time: string): (typeof BOOKING_TYPES)[number] {
  const totalMinutes = minutesFromTime(time);
  // Lunch service up to 16:59, dinner afterwards.
  return totalMinutes >= 17 * 60 ? "dinner" : "lunch";
}

export function deriveEndTime(startTime: string, bookingType: string): string {
  const startMinutes = minutesFromTime(startTime);
  const endMinutes = startMinutes + calculateDurationMinutes(bookingType);
  return minutesToTime(endMinutes);
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const startMinutesA = minutesFromTime(startA);
  const endMinutesA = minutesFromTime(endA);
  const startMinutesB = minutesFromTime(startB);
  const endMinutesB = minutesFromTime(endB);

  return startMinutesA < endMinutesB && endMinutesA > startMinutesB;
}

export async function fetchBookingsForContact(
  client: SupabaseClient,
  restaurantId: string,
  email: string,
  phone: string,
): Promise<BookingRecord[]> {
  const { data, error } = await client
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("restaurant_id", restaurantId)
    .eq("customer_email", email)
    .eq("customer_phone", phone)
    .in("status", BOOKING_BLOCKING_STATUSES)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchTablesForPreference(
  client: SupabaseClient,
  restaurantId: string,
  partySize: number,
  seatingPreference: string,
): Promise<TableRecord[]> {
  let query = client
    .from("restaurant_tables")
    .select(TABLE_SELECT)
    .eq("restaurant_id", restaurantId)
    .gte("capacity", partySize)
    .order("capacity", { ascending: true });

  if (seatingPreference !== "any") {
    query = query.eq("seating_type", seatingPreference);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function findAvailableTable(
  client: SupabaseClient,
  restaurantId: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
  partySize: number,
  seatingPreference: string,
  ignoreBookingId?: string,
): Promise<TableRecord | null> {
  const candidateTables = await fetchTablesForPreference(client, restaurantId, partySize, seatingPreference);

  for (const table of candidateTables) {
    const { data: existing, error } = await client
      .from("bookings")
      .select("id,start_time,end_time,status")
      .eq("table_id", table.id)
      .eq("booking_date", bookingDate)
      .in("status", BOOKING_BLOCKING_STATUSES)
      .order("start_time", { ascending: true });

    if (error) {
      throw error;
    }

    const conflicting = (existing ?? []).some((entry) => {
      if (ignoreBookingId && entry.id === ignoreBookingId) return false;
      return rangesOverlap(entry.start_time, entry.end_time, startTime, endTime);
    });

    if (!conflicting) {
      return table;
    }
  }

  return null;
}

export async function logAuditEvent(
  client: SupabaseClient,
  params: { action: string; entity: string; entityId?: string | null; metadata?: Record<string, unknown> }
): Promise<void> {
  const { error } = await client.from("audit_logs").insert({
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function upsertLoyaltyPoints(
  client: SupabaseClient,
  email: string,
  pointsDelta: number,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from("loyalty_points")
    .select("total_points")
    .eq("customer_email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const total = (data?.total_points ?? 0) + pointsDelta;

  const tier = total >= 500 ? "platinum" : total >= 250 ? "gold" : total >= 100 ? "silver" : "bronze";

  const { error: upsertError } = await client.from("loyalty_points").upsert(
    {
      customer_email: email,
      total_points: total,
      tier,
      last_awarded_at: nowIso,
    },
    { onConflict: "customer_email" }
  );

  if (upsertError) {
    throw upsertError;
  }
}

export async function addToWaitingList(
  client: SupabaseClient,
  payload: {
    restaurant_id: string;
    booking_date: string;
    desired_time: string;
    party_size: number;
    seating_preference: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    notes?: string | null;
  }
): Promise<void> {
  const { error } = await client.from("waiting_list").insert({
    restaurant_id: payload.restaurant_id,
    booking_date: payload.booking_date,
    desired_time: payload.desired_time,
    party_size: payload.party_size,
    seating_preference: payload.seating_preference,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    notes: payload.notes ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function softCancelBooking(client: SupabaseClient, bookingId: string): Promise<BookingRecord> {
  const { data, error } = await client
    .from("bookings")
    .update({ status: "canceled" })
    .eq("id", bookingId)
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return (data ?? null) as BookingRecord;
}

export async function updateBookingRecord(
  client: SupabaseClient,
  bookingId: string,
  payload: Partial<Omit<BookingRecord, "id" | "restaurant_id" | "created_at" | "updated_at">> & {
    restaurant_id?: string;
  }
): Promise<BookingRecord> {
  const { data, error } = await client
    .from("bookings")
    .update(payload)
    .eq("id", bookingId)
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as BookingRecord;
}

export async function insertBookingRecord(
  client: SupabaseClient,
  payload: Omit<BookingRecord, "id" | "created_at" | "updated_at" | "status" | "table_id" | "loyalty_points_awarded"> & {
    table_id: string | null;
    status?: string;
    loyalty_points_awarded?: number;
  }
): Promise<BookingRecord> {
  const { data, error } = await client
    .from("bookings")
    .insert({
      restaurant_id: payload.restaurant_id,
      table_id: payload.table_id,
      booking_date: payload.booking_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      party_size: payload.party_size,
      booking_type: payload.booking_type,
      seating_preference: payload.seating_preference,
      status: payload.status ?? "confirmed",
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      notes: payload.notes ?? null,
      loyalty_points_awarded: payload.loyalty_points_awarded ?? 0,
    })
    .select(BOOKING_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as BookingRecord;
}
