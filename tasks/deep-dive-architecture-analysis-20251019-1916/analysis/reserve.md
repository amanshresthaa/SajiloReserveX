# Reserve Module Highlights

## Wizard Reducer (`reserve/features/reservations/wizard/model/reducer.ts`)

- **Purpose**: Deterministic state machine for multi-step reservation flow (date/time → party → details → confirmation).
- **Dependencies**: Booking configuration (`BOOKING_TYPES_UI`, `SEATING_PREFERENCES_UI`), shared formatting (`formatDateForInput`, `normalizeTime`), venue defaults.
- **State Structure**:
  - `step`, `submitting`, `loading`, `error`, `editingId`, `lastAction`, `bookings`, `details`, `lastConfirmed`.
  - `details` contains booking specifics + contact info, marketing consent, remember flag.
- **Actions**:
  - `SET_STEP`, `SET_FIELD`, `SET_SUBMITTING`, `SET_LOADING`, `SET_ERROR`, `SET_BOOKINGS`.
  - `SET_CONFIRMATION`: Moves to step 4 with updated booking details.
  - `START_EDIT`: Hydrates form with selected booking for editing.
  - `RESET_FORM`: Resets to defaults while preserving remembered contact details.
  - `HYDRATE_CONTACTS`: Restores cached contact info.
- **Edge Handling**: Normalizes booking type/seating preferences via helper sets; ensures `rememberDetails` persists on reset.
- **Performance**: Pure reducer; no side-effects; safe for React `useReducer`.
- **Testing**: Should be covered by Vite tests (verify); missing dedicated reducer tests for remember flag—add.
- **Code Sample**:
  ```ts
  case 'SET_CONFIRMATION': {
    const updatedDetails = {
      ...state.details,
      bookingId: booking ? booking.id : null,
      date: booking ? booking.booking_date : state.details.date,
      time: booking ? normalizeTime(booking.start_time) ?? state.details.time : state.details.time,
      party: booking ? booking.party_size : state.details.party,
      bookingType: booking ? toBookingOption(booking.booking_type) : state.details.bookingType,
      seating: booking ? toSeatingOption(booking.seating_preference) : state.details.seating,
      notes: booking?.notes ?? state.details.notes,
      marketingOptIn: booking ? booking.marketing_opt_in : state.details.marketingOptIn,
    };
    return { ...state, step: 4, submitting: false, loading: false, editingId: null, bookings, lastAction, lastConfirmed: booking ?? state.lastConfirmed, details: updatedDetails, error: null };
  }
  ```

## API Client (`reserve/shared/api/client.ts`)

- **Purpose**: Fetch abstraction with JSON parsing, timeout, and normalized error shape for Reserve front-end.
- **Dependencies**: Reserve environment config (`env.API_BASE_URL`, `env.API_TIMEOUT_MS`).
- **Features**:
  - Default JSON headers; merges custom ones.
  - Auto-aborts requests after timeout using `AbortController`.
  - Parses response text once; handles empty body.
  - Normalizes error responses into `{ code, message, details, status }`.
  - Supports request methods via wrapper (`get`, `post`, `put`, `patch`, `delete`).
- **Edge Handling**: Ensures fetch credentials include cookies; gracefully handles non-JSON responses by returning `undefined` for success.
- **Testing**: No explicit tests; recommend mocking fetch to assert timeout and error normalization.
- **Code Sample**:
  ```ts
  async function request<TResponse>(
    path: string,
    { method = 'GET', headers, body, signal, ...init }: RequestInit & { method?: HttpMethod } = {},
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.API_TIMEOUT_MS);
    try {
      const response = await fetch(`${env.API_BASE_URL}${path}`, {
        method,
        headers: { ...defaultHeaders, ...headers },
        body,
        signal: signal ?? controller.signal,
        credentials: 'include',
        ...init,
      });
      const text = await response.text();
      const parsed = text ? JSON.parse(text) : undefined;
      if (!response.ok) {
        throw {
          code: parsed?.code ?? `${response.status}`,
          message: parsed?.message ?? response.statusText ?? 'Request failed',
          details: parsed?.details,
          status: response.status,
        };
      }
      return parsed as TResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
  ```

## Improvement Opportunities

1. Add reducer unit tests covering each action, especially remember-details logic.
2. Provide API client hook for retries/backoff and centralized logging.
3. Leverage React Query for wizard steps to unify data fetching with caching.
