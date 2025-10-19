# Capacity Engine Highlights

Focus Modules:

- `server/capacity/selector.ts`
- `server/capacity/transaction.ts`

## Selector Module

- **Purpose**: Score and rank table combinations (singles + merges) to satisfy party size with minimal overage and operational penalties.
- **Inputs**: Array of tables, adjacency graph (`Map<string, Set<string>>`), party size, scoring config (`maxOverage`, `maxTables`, `weights`).
- **Outputs**: Sorted `RankedTablePlan[]`, diagnostics (singles considered, merge evaluations, skipped reasons), optional fallback message.
- **Algorithm**:
  - Filters single tables capable of seating party; registers them with zero adjacency depth.
  - Performs BFS across merge-eligible tables up to `maxTables`, enforcing adjacency connectivity, zone consistency, and capacity overage limits.
  - Computes metrics: `overage`, `tableCount`, `fragmentation`, `zoneBalance`, `adjacencyCost`.
  - Calculates linear score using weights, sorts ascending (lower score preferred).
  - Records skip reasons for telemetry (`no_adjacency`, `cross_zone`, `overage_limit`, etc.).
- **Edge Handling**: Deduplicates combinations via id-key, tracks fallback reason distinguishing “no table fits” vs adjacency violations.
- **Performance**: BFS complexity grows with adjacency density; diagnostics enable monitoring. Potential optimization—prioritize pruning when overage minimal.
- **Testing**: Covered by `server/capacity/__tests__` (not inspected here); recommended to stress-test large graphs.
- **Key Snippet**:
  ```ts
  const maxAllowedCapacity = partySize + Math.max(maxOverage, 0);
  if (totalCapacity > maxAllowedCapacity) {
    incrementSkip(diagnostics.skipped, 'overage_limit');
    continue;
  }
  const metrics = computeMetrics(candidate, partySize, adjacencyDepths);
  const score = computeScore(metrics, weights);
  plans.push({
    tables: candidate,
    totalCapacity,
    slack: metrics.overage,
    mergeType,
    metrics,
    score,
    tableKey,
  });
  ```

## Transaction Module

- **Purpose**: Wrap Supabase RPC `create_booking_with_capacity_check` with retry semantics, error classification, and telemetry.
- **Inputs**: `CreateBookingParams`, optional Supabase client, optional retry config.
- **Outputs**: `BookingResult` (success/failure, capacity metadata, retryable flag); throws typed errors in `createBookingOrThrow`.
- **Key Behaviors**:
  - `retryWithBackoff`: Exponential backoff on retryable SQLSTATE codes (`40001`, `40P01`, `55P03`) or error strings; logs via `recordObservabilityEvent`.
  - On RPC success, logs success event and records metrics (`recordCapacityMetric`).
  - On failure, logs warning/error events with error code, sets `retryable` flag from RPC response, returns error envelope.
  - Helper `isRetryableBookingError` surfaces if caller should retry.
- **Edge Handling**: Wraps unexpected retry exhaustion as `CapacityError` with message; ensures telemetry on both success and failure.
- **Performance**: Retry delays configurable (default max retries presumably 3); `sleep` is simple Promise-based.
- **Testing**: Integration via `tests/integration/capacity-api.test.ts`; recommendation to add unit tests for retry classification.
- **Key Snippet**:
  ```ts
  try {
    response = await retryWithBackoff(rpcCall, retryConfig, {
      operation: 'create_booking_with_capacity_check',
      restaurantId: params.restaurantId,
    });
  } catch (error) {
    recordObservabilityEvent({
      source: 'capacity.transaction',
      eventType: 'booking.creation.failure',
      severity: 'error',
      context: { restaurantId: params.restaurantId, error: (error as Error).message },
    });
    throw new CapacityError(
      `Failed to create booking: ${(error as Error).message}`,
      'INTERNAL_ERROR',
    );
  }
  ```

## Improvement Opportunities

1. **Selector**: Cache adjacency depth results or apply heuristics to prune states earlier when slack already zero.
2. **Transaction**: Expose telemetry hook for external monitoring; add jitter to backoff to avoid sync retries.
3. **Metrics**: Extend diagnostics to include time complexity counters and integrate with `server/capacity/telemetry.ts`.
