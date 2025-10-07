# 11. Acceptance Criteria & Test Plan

## Critical Flow Scenarios (Gherkin)

```gherkin
Feature: Guest discovers and books a restaurant
  Scenario: Complete booking in under two minutes
    Given I am on the Home page with restaurants available
    And I select a restaurant from the top results
    When I choose a date, time, and party size
    And I enter valid guest details
    And I confirm the booking
    Then I see the booking confirmation page within 2 minutes of landing
    And the confirmation toast announces “Booking confirmed”
    And the booking appears in my dashboard

Feature: Returning user manages an existing booking
  Scenario: Cancel a future booking
    Given I am a signed-in user with at least one upcoming booking
    When I open the dashboard and select “Cancel booking”
    Then the UI shows a confirmation dialog with details
    When I confirm the cancellation
    Then the booking status updates to “Cancelled” within 500 ms
    And a success toast reads “Booking cancelled”
    And the cancellation event is tracked as `booking_cancelled`

Feature: Booking resume after reconnect
  Scenario: Finish confirmation after going offline
    Given I have filled in the booking details step
    And I lose connectivity before confirming
    When I reconnect within five minutes
    Then the review step still shows my details and a banner “You’re back online — tap confirm to finish.”
    When I press **Confirm booking**
    Then the booking completes within 500 ms
    And analytics records `booking_created` for the restaurant

Feature: Authentication recovery
  Scenario: Reset forgotten password
    Given I am on the Sign-in page
    When I select “Forgot password?”
    And I submit a registered email
    Then I see a confirmation message “Check your email for a reset link”
    And a reset email is sent via Supabase
    When I follow the link and set a new password
    Then I can sign in with the new password
    And previous sessions are invalidated
```

## Test Coverage Matrix

| Area                                       | Unit (Vitest)                                | Component (Storybook + Testing Library) | E2E (Playwright)                        | Visual Regression (Playwright snapshots) | Accessibility (axe + manual)          |
| ------------------------------------------ | -------------------------------------------- | --------------------------------------- | --------------------------------------- | ---------------------------------------- | ------------------------------------- |
| Booking availability logic (`useBookings`) | ✅ Validate query params, pagination helpers | ✅ Step forms rendering, validation     | ✅ Full booking flow (mobile + desktop) | ✅ Hero/confirmation pages               | ✅ Form labels, error focus, keyboard |
| Dashboard booking table                    | ✅ Data formatting utilities                 | ✅ Table sorting, empty/loading states  | ✅ Cancel/edit booking on real API      | ✅ Table layout across breakpoints       | ✅ Row focus, actions reachable       |
| Profile management                         | ✅ Zod schemas trim/format values            | ✅ Avatar uploader, form inputs         | ✅ Update profile & rehydrate session   | ✅ Avatar cropper alignment              | ✅ Inputs announce validation         |
| Reserve landing                            | ✅ CTA scroll helpers                        | ✅ Highlights & FAQ components          | ✅ Reserve CTA focus & offline banner   | ✅ Hero layout & responsive spacing      | ✅ Buttons 44px, contrast             |
| Authentication                             | ✅ Session reducer, auth guards              | ✅ Sign-in form, error banners          | ✅ Sign-in/out, password reset          | ✅ Auth layout on mobile                 | ✅ Focus trap in modal                |
| Blog                                       | ✅ Markdown parser utilities                 | ✅ Article preview card                 | ✅ Article navigation & canonical       | ✅ Cover image cropping                  | ✅ Heading order, skip link           |
| Global navigation                          | ✅ Route config invariants                   | ✅ Header/footer components             | ✅ Deep links + locale switch (future)  | ✅ Header sticky behavior                | ✅ Skip to content functions          |

## Testing Cadence & Tooling

- **TDD discipline**: Write failing unit/component test before implementing mutations or new UI states.
- **CI gates**: `pnpm test -- --runInBand`, `pnpm lint`, `pnpm test:e2e` (Playwright headless, mobile + desktop profiles), `pnpm test:a11y`.
- **Regression windows**: Weekly scheduled E2E run against staging; nightly Lighthouse CI performance checks.
- **Manual QA checklist**: Safari (desktop + iOS), Chrome (Android), Firefox (desktop); verify reduced-motion mode and high-contrast OS setting.
- **Bug triage**: High severity issues require failing automated test to prevent regressions before closure.
