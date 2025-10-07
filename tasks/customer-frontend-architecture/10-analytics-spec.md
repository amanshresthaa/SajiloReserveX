# 10. Analytics & Events Specification

## Stack & Instrumentation

- **Provider**: Plausible Analytics (`next-plausible`), self-hostable, GDPR-compliant (no cookies by default).
- **Dispatcher**: `lib/analytics.ts` `track(event, props)` helper; extend union to include events listed below.
- **Transport**: Client-side events via `window.plausible` with sanitized props (null/undefined stripped). Server-side events (booking success/failure) forwarded through `/api/events`.
- **Environment**: Events fire in production and staging; local dev gated behind `NEXT_PUBLIC_ENABLE_ANALYTICS`.

## PII & Privacy Policy

- **NEVER** send direct identifiers (name, email, phone, booking notes). Use opaque IDs (`bookingId`, `restaurantId`) or hashed references.
- **SHOULD** clamp numeric values (e.g., party size) within expected ranges to avoid anomalies.
- **MUST** respect user consent banner (future feature); events disabled when consent withdrawn.
- **MUST** honor `Do Not Track` (Plausible handles automatically).

## Event Taxonomy

| Event Name                 | Trigger                           | Required Props                | Optional Props                | Notes                                                |
| -------------------------- | --------------------------------- | ----------------------------- | ----------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `restaurant_list_viewed`   | Home list rendered                | `{ city?: string }`           | `{ filters?: string[] }`      | Fired once per page load after data resolved.        |
| `restaurant_selected`      | User taps a restaurant card       | `{ restaurantId, position }`  | `{ campaign?: string }`       | Helps rank top-performing restaurants.               |
| `availability_checked`     | User submits date/time/party form | `{ restaurantId, partySize }` | `{ dateISO, timeSlot }`       | Debounce to avoid spamming when user tweaks sliders. |
| `availability_empty`       | No slots returned                 | `{ restaurantId, partySize }` | `{ dateISO }`                 | Mirrors edge-case telemetry.                         |
| `details_submit_started`   | Step 3 booking details submitted  | `{ restaurantId }`            | `{ partySize }`               | Enables INP monitoring around form submit.           |
| `booking_created`          | Booking confirmed                 | `{ bookingId, restaurantId }` | `{ channel?: "web"            | "phone" }`                                           | Already implemented; extend props.  |
| `booking_validation_error` | Client-side validation fails      | `{ field, code }`             | `{ restaurantId }`            | Use for form UX improvements (PII free).             |
| `booking_server_error`     | API returns 5xx/timeout           | `{ restaurantId }`            | `{ status?: number }`         | Tie to SLO alerts.                                   |
| `booking_cancelled`        | Cancellation succeeds             | `{ bookingId }`               | `{ reason?: string }`         | Fire after optimistic update confirmed.              |
| `booking_cancel_error`     | Cancellation fails                | `{ bookingId }`               | `{ status?: number }`         | Aligns with edge case table.                         |
| `dashboard_viewed`         | Dashboard page hydration          | `{ totalBookings }`           | `{ timeframe?: "30d"          | "90d" }`                                             | Helps measure dashboard stickiness. |
| `profile_updated`          | Profile mutation success          | `{ fields: string[] }`        | `{ hasAvatar?: boolean }`     | Send list of updated field keys.                     |
| `profile_upload_error`     | Avatar upload failure             | `{ fileSize }`                | `{ fileType }`                | Clamp file size to nearest KB.                       |
| `blog_article_viewed`      | Article detail page view          | `{ articleId }`               | `{ category?: string }`       | Helps editorial planning.                            |
| `route_not_found`          | 404 rendered                      | `{ path }`                    | `{ referrer?: string }`       | Monitors broken links.                               |
| `app_error`                | Error boundary fallback           | `{ path }`                    | `{ message?: string }`        | Strip stack traces before sending.                   |
| `network_offline`          | Browser offline event             | `{ path }`                    | `{ wasOnlineForMs?: number }` | Useful for offline strategy evaluation.              |

## Machine-Readable Event Catalog

```json
{
  "events": [
    {
      "name": "restaurant_list_viewed",
      "props": { "city": "string|optional", "filters": "string[]|optional" }
    },
    {
      "name": "restaurant_selected",
      "props": { "restaurantId": "string", "position": "number", "campaign": "string|optional" }
    },
    {
      "name": "availability_checked",
      "props": {
        "restaurantId": "string",
        "partySize": "number",
        "dateISO": "string|optional",
        "timeSlot": "string|optional"
      }
    },
    {
      "name": "availability_empty",
      "props": { "restaurantId": "string", "partySize": "number", "dateISO": "string|optional" }
    },
    {
      "name": "details_submit_started",
      "props": { "restaurantId": "string", "partySize": "number|optional" }
    },
    {
      "name": "booking_created",
      "props": {
        "bookingId": "string",
        "restaurantId": "string",
        "channel": "\"web\"|\"phone\"|optional"
      }
    },
    {
      "name": "booking_validation_error",
      "props": { "field": "string", "code": "string", "restaurantId": "string|optional" }
    },
    {
      "name": "booking_server_error",
      "props": { "restaurantId": "string", "status": "number|optional" }
    },
    {
      "name": "booking_cancelled",
      "props": { "bookingId": "string", "reason": "string|optional" }
    },
    {
      "name": "booking_cancel_error",
      "props": { "bookingId": "string", "status": "number|optional" }
    },
    {
      "name": "dashboard_viewed",
      "props": { "totalBookings": "number", "timeframe": "\"30d\"|\"90d\"|optional" }
    },
    {
      "name": "profile_updated",
      "props": { "fields": "string[]", "hasAvatar": "boolean|optional" }
    },
    {
      "name": "profile_upload_error",
      "props": { "fileSize": "number", "fileType": "string|optional" }
    },
    {
      "name": "blog_article_viewed",
      "props": { "articleId": "string", "category": "string|optional" }
    },
    { "name": "route_not_found", "props": { "path": "string", "referrer": "string|optional" } },
    { "name": "app_error", "props": { "path": "string", "message": "string|optional" } },
    {
      "name": "network_offline",
      "props": { "path": "string", "wasOnlineForMs": "number|optional" }
    }
  ],
  "piiPolicy": {
    "forbidden": ["name", "email", "phone", "notes", "fullAddress"],
    "hashing": ["bookingId", "restaurantId"],
    "consentGate": "NEXT_PUBLIC_ANALYTICS_CONSENT === \"granted\""
  }
}
```
