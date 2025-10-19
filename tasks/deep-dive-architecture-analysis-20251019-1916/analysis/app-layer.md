# App Layer Analysis

## Root Layout (`src/app/layout.tsx`)

- **Purpose**: Provides the global HTML scaffold, default SEO metadata, and top-level client providers.
- **Imports**: `getSEOTags`, `ClientLayout`, `config`, `PlausibleProvider`, `AppProviders`, global CSS.
- **Exports**: `viewport`, `metadata`, default `RootLayout` component.
- **Implementation Highlights**:
  - Renders `<html>` with locale/config-driven attributes and injects Plausible analytics only when a domain is configured.
  - Adds a skip link for accessibility and wraps children with `AppProviders` → `ClientLayout` to bridge RSC with client-side wrappers.
- **Edge Handling**: Minimal runtime branching; relies on Next.js runtime for error handling.
- **Performance Notes**: Only static rendering plus optional script tag; negligible overhead.
- **Testing**: Covered indirectly via end-to-end rendering; no dedicated unit test.
- **Improvements**: Add smoke tests verifying skip link and provider presence when refactoring.
- **Code Reference**:
  ```tsx
  return (
    <html lang={config.locale ?? 'en'} className="antialiased font-sans" style={htmlStyle}>
      {config.domainName && (
        <head>
          <PlausibleProvider domain={config.domainName} />
        </head>
      )}
      <body className="relative font-sans">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <AppProviders>
          <ClientLayout>{children}</ClientLayout>
        </AppProviders>
      </body>
    </html>
  );
  ```

## Ops App Layout (`src/app/(ops)/ops/(app)/layout.tsx`)

- **Purpose**: Server component gating Ops dashboard routes, wiring Supabase session and membership context.
- **Imports**: `OpsShell`, `OpsServicesProvider`, `OpsSessionProvider`, Supabase client helpers, membership fetcher, `env`.
- **Exports**: Default async layout.
- **Implementation Highlights**:
  - Reads cookie to restore sidebar state, fetches current user and memberships, maps them to `OpsSessionProvider`.
  - Derives feature flags from environment to toggle capacity/metrics modules.
  - Logs but suppresses failures in Supabase calls to avoid hard-blocking layout rendering.
- **Edge Handling**: Missing user or memberships degrade gracefully to `null` user/empty array.
- **Performance Notes**: Hits Supabase twice (auth + memberships); potential caching opportunity.
- **Testing**: Integration tested through Ops dashboard flows; no standalone unit tests.
- **Improvements**: Backfill contract test ensuring `featureFlags` mirrors `env.featureFlags`.
- **Code Reference**:

  ```tsx
  const opsMemberships = memberships
    .filter((membership) => Boolean(membership.restaurant_id))
    .map(mapMembershipToOps);

  return (
    <OpsSessionProvider
      user={supabaseUser}
      memberships={opsMemberships}
      initialRestaurantId={initialRestaurantId}
      featureFlags={featureFlags}
    >
      <OpsServicesProvider>
        <OpsShell defaultSidebarOpen={defaultOpen}>{children}</OpsShell>
      </OpsServicesProvider>
    </OpsSessionProvider>
  );
  ```
