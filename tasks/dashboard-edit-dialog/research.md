# Dashboard Edit Dialog — Research

## Task Outline & Subtasks

- Understand current dashboard table structure to hook edit actions.
- Inspect existing server API (`PUT /api/bookings/[id]`) to know payload/response and error codes for mapping.
- Determine shadcn dialog components available and RHF/zod setup patterns in repo.
- Identify toast/notification utilities for success/error feedback.

## Findings

- `BookingsTable` presently renders a disabled “Manage” button per row. Need to replace with menu/actions to open edit dialog.
- `PUT /api/bookings/[id]` route already exists (`app/api/bookings/[id]/route.ts`), expecting body `{ startIso, endIso, partySize, notes? }` and returns booking object. Error codes: per sprint doc: `OVERLAP_DETECTED`, `CUTOFF_PASSED`, etc. Need to confirm actual API shape.
- We have `components/ui/dialog.tsx`? need to confirm. `components/ui` currently lacks `dialog.tsx`; may need to add from shadcn. Should check `components/ui` list (already looked earlier; no dialog). For edit dialog, probably necessary to add `components/ui/dialog.tsx` via template. We'll create manual version.
- For forms: `components/ui/form.tsx` already present (RHF integration). Should leverage `react-hook-form` and `zod`. Check dependencies: `package.json` includes `react-hook-form`, `@hookform/resolvers`, `zod` already used in other modules.
- Need date/time inputs? For MVP we can use simple `<input type="datetime-local">` or separate. Sprint mention simple inputs this sprint. We'll capture start/end in local time and convert to ISO using `Date`. Need to manage timezone: currently stored as ISO; we can use `new Date(value).toISOString()`. Pre-fill with booking's `startIso` and `endIso` (converted to `yyyy-MM-ddTHH:mm` for `datetime-local`). Provide min values etc.
- For analytics: events `booking_edit_opened`, `booking_edit_submitted`, `booking_edit_succeeded`, `booking_edit_failed`. Should integrate emitter to new events.
- React Query mutate hook: need new `hooks/useUpdateBooking.ts` using `useMutation`, calling `fetchJson` with `PUT` request. Should invalidate bookings list (use queryClient.invalidateQueries). Need keys: `queryKeys.bookings.all` maybe? currently `queryKeys` only has `bookings.{all,list,detail}`; `all` is `['bookings']`. Invalidate `queryKeys.bookings.list`. We'll manage.
- Need toast component for success/error? `components/LayoutClient` includes Toaster from `react-hot-toast`; we can use `toast` from `react-hot-toast`. Need import from `react-hot-toast`. Provide messaging.
- Manage state in table for currently editing booking; pass to dialog component.

## Considerations & Risks

- Controlled vs uncontrolled date/time inputs: ensure `datetime-local` expects local time; converting from ISO (UTC) may shift. Might need to convert to local timezone string. Use `new Date(startIso)` convert to `toISOString().slice(0,16)` but that'll be UTC. For local display, prefer using util to convert to local, e.g. `const dt = new Date(iso); dt.toISOString().slice(0,16)` yields UTC. Instead use helper to format to local `YYYY-MM-DDTHH:MM` using timezone offset. We'll implement function. When converting back to ISO using `new Date(localValue)`; treat as local time by constructing `Date`. Need to ensure `datetime-local` string is parseable by `new Date(value)` in local timezone. (It interprets as local). We'll implement util functions.
- Need to disable manage button for statuses not allowed? D1 mention disabled if within cutoff with tooltip. Without server data, we can disable when status cancelled? For now keep simple enabling for statuses not cancelled, and note TODO.
- Testing: no automated tests mandated? D1 spec requested RTL tests for validation & error mapping. Should add test file using `@testing-library/react`. We'll create tests verifying error mapping etc.

## Open Questions

- Should we include party size min constraint? Use zod to ensure >=1.
- Are we expected to manage end time? For simple form, maybe allow selecting duration via time steps; we can auto compute end by simplistic addition (maybe keep separate input). Sprint doc expects startIso & endIso fields. We'll allow editing start & end times separately.
