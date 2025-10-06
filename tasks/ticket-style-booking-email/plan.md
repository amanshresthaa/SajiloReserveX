# Plan: Ticket-style booking email template

1. Design updated HTML structure resembling a ticket:
   - Header strip with restaurant name and booking reference.
   - Main body with key booking facts (date, time range, party, booking type, seating, status/notes).
   - Side or footer section for venue contact + cancellation policy.
   - Manage button styled as primary action.
2. Update `renderHtml` in `server/emails/bookings.ts` to output the new layout, ensuring inline styles and accessibility (semantic headings, sufficient contrast, mobile-friendly stacking).
3. Extend `renderText` so the plain-text version mirrors all surfaced details (including new fields and clear separators).
4. Refresh copy in `dispatchEmail` switch cases to align with new style (concise intros, mention pending allocation when applicable).
5. Verify TypeScript builds locally (tsc or appropriate lint) if needed; run `/api/test-email` route manually after to preview (document in verification).
6. Document any follow-up checks (e.g., send test email via existing test route) in `tasks/ticket-style-booking-email/verification.md`.
