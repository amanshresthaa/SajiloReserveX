# ADR: Guest Booking Lookup Strategy

- **Date:** 2025-10-12
- **Status:** Proposed (pending stakeholder buy-in)
- **Authors:** Codex (AI agent)
- **Related Stories:** S1.2 (Guest lookup spike), S2.1 (Guest lookup implementation)

---

## 1. Problem Statement

Guests currently cannot retrieve their bookings because the GET `/api/bookings?email=…&phone=…` handler uses the session-bound Supabase anon client, which is blocked by RLS policies that only grant `SELECT` access to authenticated restaurant staff (`user_restaurants()` function). We need a secure way for guests to self-serve without exposing cross-tenant data or weakening the platform’s zero-trust posture.

**Constraints confirmed via code + schema inspection**

| Constraint                                                  | Evidence                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `customers` table lacks guest-safe projection               | `supabase/migrations/20251006170446_remote_schema.sql:299-430`                                                                             |
| Existing columns include normalized email/phone but no hash | Same schema snippet                                                                                                                        |
| RLS for `customers`/`bookings` only permits staff           | Policies at `supabase/migrations/20251006170446_remote_schema.sql` (search for `"Staff can view bookings"` / `"Staff can view customers"`) |
| Application fetch path uses anon client                     | `app/api/bookings/route.ts:188-232`                                                                                                        |
| `pgcrypto` extension available (needed for hashing)         | `supabase/migrations/20251006170446_remote_schema.sql:41`                                                                                  |

---

## 2. Decision Drivers

1. **Zero data leakage:** Prevent exposing whether a booking exists across tenants.
2. **Brute-force resilience:** Make enumeration of email/phone combinations prohibitively expensive.
3. **Operational simplicity:** Avoid long-lived service-role sessions wherever possible.
4. **Observability:** Maintain ability to trace requests (metrics, audit logs).
5. **Performance:** Keep lookup latency under 150 ms p95 under expected load (~50 rps spike).
6. **Implementation feasibility:** Minimize migration risk on remote Supabase (no downtime).

---

## 3. Options Considered

### Option A — Hashed-Contact RLS Path (Recommended)

Create a salted hash of `(restaurant_id, email_normalized, phone_normalized)` stored in `customers.contact_lookup_hash`, expose a **security definer** Postgres function that returns a minimal booking projection when the supplied hash matches, and invoke the function using the anon client. Application computes the hash using a server-held pepper so attackers cannot pre-compute dictionaries.

### Option B — Service-Role Lookup with Heavy Validation

Keep using the service-role Supabase client for guest lookup; perform server-side normalization, enforce strict rate limiting and anomaly detection, mask response timing, and return minimal fields. Rely on runtime controls rather than DB-layer RLS to protect data.

### Option C — OTP-Based Email Portal (Deferred idea)

Send a one-time code to the guest’s email/phone, require OTP verification before returning bookings. High UX friction and not scoped for current sprint; noted for future hardening.

---

## 4. Deep Evaluation

### 4.1 Security Posture

- **Option A**
  - Hash computed with pepper (`HMAC-SHA-256`) prevents offline rainbow attacks; even if attacker guesses raw email+phone, they cannot compute hash without secret.
  - Security definer function can enforce `restaurant_id` match and limit projection to safe fields. RLS remains intact for raw tables.
  - Attack surface reduced to brute forcing hash via API; rate limiting still advised but compromise impact limited (no disclosive responses beyond “not found”).
- **Option B**
  - Service role bypasses RLS entirely; mistakes in input validation or missing rate limits could leak cross-tenant PII.
  - Requires consistent 429 enforcement and anomaly alerting; still exposes timing differences unless padded carefully.
- **Option C**
  - Strong security but adds multi-step UX and larger implementation surface (email/SMS, code throttling). Out of sprint scope.

**Verdict:** Option A offers defense-in-depth by keeping data surface inside RLS boundaries; Option B relies heavily on perfect runtime controls.

### 4.2 Implementation Complexity

- **Option A**
  - Requires migration adding new column + indexes + trigger (or generated column) + policy adjustments.
  - Need to update all customer write paths (`server/customers.ts`, seed scripts) to compute/store hash using new `env.security.guestLookupPepper`.
  - Requires new Supabase function + privileges.
  - Frontend/API changes limited to hashing email/phone and calling RPC.
- **Option B**
  - Less DB work; mostly API modifications (validation, rate limiter). However, we currently lack shared rate-limiting middleware, so still non-trivial.
  - Must audit all call sites to ensure service client use is safe.

**Verdict:** Option A has higher upfront DB effort but localized; Option B spreads complexity across application & infrastructure.

### 4.3 Performance & Scalability

- **Option A**
  - Lookup reduces to indexed equality on hash (~O(1)). Hash column index expected to be selective.
  - Security definer function overhead negligible.
- **Option B**
  - Direct table query via service role (similar latency) but adds rate-limit storage (Redis) and constant-time padding logic.
  - Rate-limiter state may become a bottleneck if centralized.

**Verdict:** Option A simpler runtime path; Option B introduces external dependencies that must scale.

### 4.4 Risk Analysis

To test assumptions, I attempted to “break” Option A mentally:

1. **What if pepper leaks?** Then hash degenerates to deterministic value → still better than plaintext but enumeration easier. Mitigation: rotate pepper, store in secret manager, rotate hashes via backfill job.
2. **What about existing customers?** Need migration to backfill hash for historical data; risk of long-running transaction. Solution: migrate in batches using Supabase scripting or background job.
3. **Multi-channel bookings (email-only)?** Guests must provide phone + email today. If requirement changes, hash concatenation must adjust; design using normalized fallback (e.g., `COALESCE(phone_normalized, '-')`).
4. **Supabase RLS function caching?** Security definer must `SET search_path` to avoid injection; ensure function defined with `SECURITY DEFINER` + `SET search_path = public`.
5. **UI sending raw contact to API** – still necessary; we already transmit plain contact today. Hashing does not remove need for TLS but ensures DB uses hashed comparator.

For Option B, I simulated failure modes:

1. Forgot to rate-limit → immediate enumeration vulnerability.
2. Race condition between validation and service-role query; membership scope mistakes leak bookings.
3. Operational overhead to monitor 429 vs 200 metrics across tenants non-trivial.

After cross-checking with Supabase docs on security definers and hashed lookups, Option A remained preferable.

---

## 5. Decision

**Adopt Option A (Hashed-Contact RLS Path)** with the following specifics:

1. **Schema changes**
   - Add `contact_lookup_hash text` column to `public.customers`, default `NULL`.
   - Create function `public.compute_contact_lookup_hash(restaurant_id uuid, email text, phone text, pepper text)` returning text, leveraging `encode(digest(...),'hex')`.
   - Add trigger on `customers` (before insert/update) to populate hash using a stored `public.guest_lookup_pepper()` or rely on application layer to pass computed value (decision below).
   - Build index on `(restaurant_id, contact_lookup_hash)` for fast equality checks.

2. **Pepper management**
   - Store pepper in application config (`env.security.guestLookupPepper`), not in DB. Application computes hash and sends to Supabase (and ensures column persisted). This avoids exposing pepper inside PL/pgSQL code.

3. **Security definer function**
   - `public.get_guest_bookings(p_restaurant uuid, p_hash text)` returning setof a new lightweight view `public.v_guest_bookings` containing: `id, restaurant_id, start_at, end_at, party_size, status, customer_name_initials`.
   - Function validates `contact_lookup_hash = p_hash AND restaurant_id = p_restaurant`, optionally verifying booking `status IN ('pending','pending_allocation','confirmed')`.
   - Function sets `search_path` explicitly and is granted to `anon`.

4. **API changes**
   - Server validates email/phone, normalizes, computes hash with pepper, calls Supabase RPC via anon client (`supabase.rpc("get_guest_bookings", {...})`).
   - Apply IP+restaurant token bucket rate limiting (still needed but can be lighter).
   - Maintain neutral responses (`{ bookings: [] }`) regardless of mismatch reason.

5. **Backfill plan**
   - Migration sets initial hash for existing rows using `UPDATE customers SET contact_lookup_hash = encode(digest(restaurant_id::text || ':' || email_normalized || ':' || phone_normalized || ':' || current_setting('guest_lookup.pepper')), 'hex')`. Since we prefer pepper outside DB, run one-time backfill via application script.

6. **Observability**
   - Log lookup attempts with hashed contact truncated (first 6 chars) + request metadata to detect abuse.

---

## 6. Implementation Outline

1. **Migrations**
   - Create new Supabase migration adding column + index + view + function skeleton.
   - Ensure RLS prevents direct select on bookings/customers, only via function.

2. **Application updates**
   - Introduce helper `computeGuestLookupHash` (TypeScript) using Node’s `crypto.createHmac("sha256", pepper)`.
   - Update `fetchBookingsForContact` call site for guest endpoint to use RPC.
   - Extend customer upsert path to set `contact_lookup_hash` when `env.security.guestLookupPepper` present; fallback to warning if missing.

3. **Backfill script**
   - Build idempotent script (maybe `scripts/backfill-guest-hash.ts`) reading customers in batches, writing hashed values via service-role client.

4. **Testing**
   - Unit tests for hash helper (ensuring same inputs produce identical outputs).
   - Vitest for API route verifying RPC call with expected params and sanitized responses.
   - Supabase policy tests (SQL) to prove function returns data only when both restaurant and hash match.
   - Fuzz/perf tests measuring timing parity for found/not found.

5. **Rollout**
   - Ship behind feature flag `FEATURE_GUEST_LOOKUP_POLICY`.
   - Stage: enable in staging, run manual QA (Chrome DevTools) verifying responses.
   - Production: enable for pilot restaurants, monitor lookup success vs failure, 429 rate.

---

## 7. Verification & Cross-Checks

- Validated `customers` schema via `sed` (see evidence table) and cross-referenced TypeScript types to confirm no existing hash field.
- Confirmed `pgcrypto` availability (critical for hashing).
- Manually reasoned about RLS policies and double-checked with `rg` to ensure no conflicting guest policy exists.
- Re-reviewed application fetch path to ensure change impact localized to `app/api/bookings/route.ts`.
- Considered pepper leakage and enumerated mitigation steps (rotation, logs, alerts).

---

## 8. Unresolved Questions

1. **Pepper storage**: Should we keep pepper solely in application env or leverage Supabase vault? Need product/security decision.
2. **Backfill timeline**: Remote DB update may lock table briefly; coordinate maintenance window.
3. **Partial contact recovery**: Do we need to support email-only lookups? Not currently, but future requirement would affect hash formula.

---

## 9. Final Reflection

After finishing the analysis I re-ran through the reasoning chain from scratch:

1. Re-stated goal (“enable guest lookup securely”).
2. Re-verified constraints (RLS, schema, anon client).
3. Re-evaluated Option B to see if assumptions changed—still hinges on unproven rate-limiting infra and leaves RLS gap.
4. Re-checked that Option A’s migration + pepper plan addresses brute force and cross-tenant leakage better than status quo.

No new contradictions surfaced, so I’m comfortable recommending Option A with the precautions enumerated above.

---
