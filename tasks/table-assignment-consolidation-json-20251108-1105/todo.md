# Implementation Checklist

## Setup

- [x] Confirm target file list from `context/README.md`.

## Core

- [x] Run the documented Node script to regenerate `context/table-assignment-code.json` with sorted keys.

## Verification

- [x] Validate the JSON structure via `jq 'keys' context/table-assignment-code.json`.

## Notes

- Assumptions: File list is still accurate; no new table-assignment modules were introduced outside the documented paths.
- Deviations: None.
