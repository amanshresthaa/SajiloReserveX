# Implementation Checklist: Optimize Manual Table Assignment

## Phase 1: Component Creation

- [ ] Create `AssignmentToolbar` component (Compact controls)
- [ ] Create `BookingAssignmentTabContent` component (Isolated state)

## Phase 2: Refactoring

- [ ] Move state (`selectedTables`, `validationResult`) to `BookingAssignmentTabContent`
- [ ] Integrate `TableFloorPlan` into `BookingAssignmentTabContent`
- [ ] Replace "Tables" tab content in `BookingDetailsDialog`
- [ ] Remove legacy components (`ManualAssignmentSummaryCard`, `ManualAssignmentValidationPanel`)

## Phase 3: Verification

- [ ] Verify table selection is responsive
- [ ] Verify assignment flow (Validate -> Confirm) works
- [ ] Verify "Clear" works
- [ ] Check for regression in "Unassign" functionality
