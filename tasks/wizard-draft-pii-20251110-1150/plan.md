# Implementation Plan

1. Introduce contact-specific storage helpers in `useWizardDraftStorage.ts` using `sessionStorage` and a new schema/version.
2. Update draft save/load logic to sanitize contact fields before persisting to localStorage, write the sensitive portion to session storage, and merge it back when hydrating.
3. Automatically migrate any legacy drafts that still have PII fields when read, moving the data into the new session storage and rewriting the draft entry.
4. Ensure draft clearing removes both local and session entries.
5. Run `pnpm lint`.
