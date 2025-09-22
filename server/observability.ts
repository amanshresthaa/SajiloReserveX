import { getServiceSupabaseClient } from "@/server/supabase";

export type ObservabilitySeverity = "info" | "warning" | "error" | "critical";

export async function recordObservabilityEvent(params: {
  source: string;
  eventType: string;
  severity?: ObservabilitySeverity;
  context?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const supabase = getServiceSupabaseClient();
    await supabase.from("observability_events").insert({
      source: params.source,
      event_type: params.eventType,
      severity: params.severity ?? "info",
      context: params.context ?? null,
    });
  } catch (error) {
    console.error("[observability] failed to record event", {
      source: params.source,
      eventType: params.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
