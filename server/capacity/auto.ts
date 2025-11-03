import { getServiceSupabaseClient } from "@/server/supabase";

import { assignTableToBooking, findSuitableTables } from "./tables";

/**
 * Attempts to auto-assign the best ranked table plan for a booking.
 * - Uses existing manual selection logic (planner + assign) under the hood.
 * - Idempotent-ish via assignTableToBooking's internal idempotency keying.
 * - Returns true if at least one assignment was committed; false otherwise.
 */
export async function autoAssignBestTablesForBooking(bookingId: string): Promise<boolean> {
  try {
    const client = getServiceSupabaseClient();

    // Rank candidate plans using the same logic as manual selection flows
    const plans = await findSuitableTables({ bookingId, client });
    const top = plans[0];
    if (!top || !Array.isArray(top.tables) || top.tables.length === 0) {
      return false;
    }

    const tableIds = top.tables.map((t) => t.id).filter((id): id is string => typeof id === "string" && id.length > 0);
    if (tableIds.length === 0) {
      return false;
    }

    // Use the same assign routine as manual assignment (no user actor)
    await assignTableToBooking(bookingId, tableIds, null, client, {
      // use default adjacency from allocator policy; explicit override not required here
      requireAdjacency: false,
    });
    return true;
  } catch (error) {
    // Swallow errors for background attempts; callers can decide whether to retry
    console.warn("[capacity.auto] autoAssignBestTablesForBooking failed", {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export default autoAssignBestTablesForBooking;

