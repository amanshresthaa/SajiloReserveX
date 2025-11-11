# Research: Wizard Draft PII Exposure

## Requirements

- Prevent long-lived localStorage copies of guest PII (name, email, phone) from the reservation wizard draft state.
- Preserve the ability to resume an in-progress booking across steps within the same browser session.

## Findings

- `useWizardDraftStorage.ts` persisted the entire `BookingDetails` object into localStorage for 6 hours, including name/email/phone.
- Even after submission, legacy drafts kept contact fields indefinitely until TTL expired.
- Session-only storage is sufficient for active tabs; we can relocate sensitive fields to `sessionStorage` while keeping non-PII fields in `localStorage`.

## Proposed Approach

1. Strip contact fields before writing drafts to localStorage and instead store them in a namespaced `sessionStorage` entry with the same TTL.
2. Automatically migrate existing drafts by detecting legacy entries containing PII, moving the contact info into session storage, and rewriting the localStorage record without PII.
3. Merge session-stored contacts back into drafts when hydrating so UX remains unchanged.
4. Clear both local- and session-storage entries when the draft is cleared.
