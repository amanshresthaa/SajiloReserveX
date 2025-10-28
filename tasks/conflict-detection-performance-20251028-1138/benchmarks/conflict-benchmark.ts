import { DateTime } from "luxon";
import { performance } from "node:perf_hooks";

import { createAvailabilityBitset, markWindow } from "@/server/capacity/planner/bitset";
import { __internal, type ManualAssignmentConflict } from "@/server/capacity/tables";

const { computeBookingWindow, extractConflictsForTables, windowsOverlap } = __internal;

type AvailabilityEntry = {
  bitset: ReturnType<typeof createAvailabilityBitset>;
  windows: Array<{
    tableId: string;
    startAt: string;
    endAt: string;
    bookingId: string | null;
    source: "booking" | "hold";
  }>;
};

type AvailabilityMap = Map<string, AvailabilityEntry>;

type SyntheticConfig = {
  tableCount: number;
  windowsPerTable: number;
  windowSpacingMinutes: number;
  durationMinutes: number;
};

function toIsoOrThrow(value: DateTime): string {
  const iso = value.toISO({ suppressMilliseconds: true });
  if (!iso) {
    throw new Error("Unable to serialize benchmark DateTime to ISO string");
  }
  return iso;
}

function registerWindow(
  map: AvailabilityMap,
  tableId: string,
  window: { startAt: string; endAt: string; bookingId: string | null; source: "booking" | "hold" },
): void {
  if (!map.has(tableId)) {
    map.set(tableId, { bitset: createAvailabilityBitset(), windows: [] });
  }
  const entry = map.get(tableId)!;
  markWindow(entry.bitset, window.startAt, window.endAt);
  entry.windows.push({ tableId, ...window });
}

function buildSyntheticAvailability(config: SyntheticConfig): AvailabilityMap {
  const { tableCount, windowsPerTable, windowSpacingMinutes, durationMinutes } = config;
  const base = DateTime.fromISO("2025-03-10T19:00:00Z");
  const map: AvailabilityMap = new Map();

  for (let tableIndex = 0; tableIndex < tableCount; tableIndex += 1) {
    const tableId = `t-${tableIndex + 1}`;
    const clusterOffset = (() => {
      switch (tableIndex % 5) {
        case 0:
          return 0; // overlaps target window
        case 1:
          return -240; // early afternoon
        case 2:
          return 210; // late evening
        case 3:
          return -360; // morning
        default:
          return 420; // close to midnight
      }
    })();
    for (let windowIndex = 0; windowIndex < windowsPerTable; windowIndex += 1) {
      const start = base.plus({
        minutes: clusterOffset + windowIndex * windowSpacingMinutes + (windowIndex % 4 === 0 ? 5 : 0),
      });
      const end = start.plus({ minutes: durationMinutes + (windowIndex % 2 === 0 ? 15 : 0) });
      registerWindow(map, tableId, {
        startAt: toIsoOrThrow(start),
        endAt: toIsoOrThrow(end),
        bookingId: `b-${tableIndex + 1}-${windowIndex + 1}`,
        source: windowIndex % 4 === 0 ? "hold" : "booking",
      });
    }
  }

  return map;
}

function legacyEnumerateConflicts(
  busy: AvailabilityMap,
  tableIds: string[],
  window: ReturnType<typeof computeBookingWindow>,
): ManualAssignmentConflict[] {
  const conflicts: ManualAssignmentConflict[] = [];
  const start = toIsoOrThrow(window.block.start.toUTC());
  const end = toIsoOrThrow(window.block.end.toUTC());

  for (const tableId of tableIds) {
    const entry = busy.get(tableId);
    if (!entry) continue;
    for (const other of entry.windows) {
      if (windowsOverlap({ start, end }, { start: other.startAt, end: other.endAt })) {
        conflicts.push({
          tableId,
          bookingId: other.bookingId,
          startAt: other.startAt,
          endAt: other.endAt,
          source: other.source,
        });
      }
    }
  }

  return conflicts;
}

function timeExecution(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    fn();
  }
  return performance.now() - start;
}

function main(): void {
  const synthetic = buildSyntheticAvailability({
    tableCount: 120,
    windowsPerTable: 18,
    windowSpacingMinutes: 20,
    durationMinutes: 45,
  });
  const tableIds = Array.from(synthetic.keys());
  const bookingWindow = computeBookingWindow({
    startISO: "2025-03-10T19:05:00Z",
    partySize: 4,
  });

  const iterations = 200;

  // Warm-up
  extractConflictsForTables(synthetic, tableIds, bookingWindow);
  legacyEnumerateConflicts(synthetic, tableIds, bookingWindow);

  const modernMs = timeExecution(
    () => {
      extractConflictsForTables(synthetic, tableIds, bookingWindow);
    },
    iterations,
  );

  const legacyMs = timeExecution(
    () => {
      legacyEnumerateConflicts(synthetic, tableIds, bookingWindow);
    },
    iterations,
  );

  const improvement = ((legacyMs - modernMs) / legacyMs) * 100;

  console.log("Conflict extraction benchmark");
  console.log(`Tables: ${tableIds.length}, windows per table: 18, iterations: ${iterations}`);
  console.log(`Legacy enumerator: ${legacyMs.toFixed(2)}ms`);
  console.log(`Bitset short-circuit: ${modernMs.toFixed(2)}ms`);
  console.log(`Improvement: ${improvement.toFixed(1)}%`);
}

main();
