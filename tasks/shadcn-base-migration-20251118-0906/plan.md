---
task: shadcn-base-migration
timestamp_utc: 2025-11-18T09:06:00Z
owner: github:@amankumarshrestha
reviewers: [github:@maintainers]
risk: low
flags: []
related_tickets: []
---

# Implementation Plan: Low-Risk Shadcn Base Migration

## Objective

We will align low-risk UI components (alerts, badges, tooltips, simple buttons/tabs) to Shadcn primitives while preserving their public APIs and behaviors.

## Success Criteria

- [ ] Listed components render via Shadcn primitives with equivalent visual tone and interactions.
- [ ] No breaking prop/API changes; callers remain valid.
- [ ] A11y semantics (roles, aria-label/live regions, focus) maintained or improved.

## Architecture & Components

- Alerts/banners: `components/dashboard/EmptyState.tsx`, `src/components/features/booking-state-machine/BookingOfflineBanner.tsx`, `reserve/features/reservations/wizard/ui/WizardOfflineBanner.tsx`, `components/Problem.tsx`.
- Badges/tabs: `components/dashboard/StatusChip.tsx`, `src/components/features/dashboard/StatusBadge.tsx`, `components/dashboard/StatusFilterGroup.tsx`, `src/components/features/booking-state-machine/BookingStatusBadge.tsx`, `components/mobile/CategoryTab.tsx`, `components/mobile/BottomTabs.tsx`.
- Tooltip: `src/components/features/restaurant-settings/HelpTooltip.tsx`.
- Buttons/CTA/export: `components/ButtonLead.tsx`, `components/ButtonSupport.tsx`, `components/ButtonSignin.tsx`, `components/ButtonGradient.tsx`, `components/mobile/PrimaryButton.tsx`, `components/CTA.tsx`, `src/components/features/customers/ExportCustomersButton.tsx`, `src/components/features/dashboard/ExportBookingsButton.tsx`.
- Additional presentational targets: `components/Modal.tsx` (dialog wrapper), `components/FeaturesGrid.tsx` (landing demo buttons), `components/Hero.tsx` (landing CTA).

## Data Flow & API Contracts

- Purely presentational; no new data sources. Existing analytics, fetch calls, and queue hooks remain unchanged. Buttons continue to call current handlers.

## UI/UX States

- Preserve existing copy and conditional rendering (offline banners, export loading states).
- Maintain loading/disabled states on export buttons and lead form.
- Ensure tabs maintain active indication and accessible `role="tablist"` semantics via Shadcn `Tabs`/`TabsTrigger`.

## Edge Cases

- Offline banners: respect `isOffline`/`pending` logic; keep `aria-live`/`role=status`.
- Status badges: map statuses to variants/colors without losing pulse indication.
- Auth button: handle logged-in avatar rendering and navigation without regressions.
- Lead form: keep loading spinner feedback and disabled state.

## Testing Strategy

- Manual regression of each component in isolated stories/pages (where available) and via direct render checks.
- Accessibility spot checks (aria-labels, roles, focus states).
- Chrome DevTools MCP manual QA for touched UI (console/network, device emulation).

## Rollout

- No feature flags; ship behind task branch with verification artifacts.

## DB Change Plan (if applicable)

- N/A (UI-only).
