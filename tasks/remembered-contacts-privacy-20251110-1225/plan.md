# Implementation Plan

1. Introduce `StoredContacts` metadata (version + timestamps) and helper functions to read/write/remove under `storageKeys.contacts`.
2. Apply a 30‑day TTL; trim/sanitize values before saving and skip storage if all fields are empty.
3. Immediately remove the entry when `rememberDetails` becomes false.
4. Update hydration effect to read the new envelope, respect TTL, and hydrate the remembered flag.
5. Run `pnpm lint`.
