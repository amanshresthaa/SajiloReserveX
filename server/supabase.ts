import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Database = any;

let serviceClient: SupabaseClient<Database> | null = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getServiceSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }

  return serviceClient;
}

export function getDefaultRestaurantId(): string {
  return process.env.BOOKING_DEFAULT_RESTAURANT_ID ?? process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ?? "f6c2f62d-0b6c-4dfd-b0ec-2d1c7a509a68";
}

export const BOOKING_BLOCKING_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "completed",
];

