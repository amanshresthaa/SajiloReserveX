# Research: Remembered Contacts Privacy Guardrail

## Requirements

- Reduce persistence duration of contact details saved via “Remember my info” in the reservation wizard.
- Avoid keeping stale PII indefinitely when the user toggles off the option.

## Findings

- `useRememberedContacts` stored name/email/phone directly in `localStorage` without expiry.
- Even after the user deselected “remember me”, the entry remained until new data overwrote it.

## Direction Picked

- Store contacts with a metadata envelope `{version, savedAt, expiresAt, remember}` and prune once stale (30‑day TTL).
- Skip storing when all contact fields are empty; remove the entry immediately when `rememberDetails` becomes false.
- Hydrate only when non-expired data exists, preserving the user’s preference flag.
