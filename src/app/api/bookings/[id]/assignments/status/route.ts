import { NextResponse } from "next/server";
import { z } from "zod";

import { getServiceSupabaseClient } from "@/server/supabase";
import { getBookingTableAssignments } from "@/server/capacity";

import type { NextRequest } from "next/server";

const paramsSchema = z.object({ id: z.string().uuid() });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const parsed = paramsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  try {
    const client = getServiceSupabaseClient();
    const assignments = await getBookingTableAssignments(parsed.data.id, client);
    const assigned = Array.isArray(assignments) && assignments.length > 0;
    return NextResponse.json({ assigned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load assignment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

