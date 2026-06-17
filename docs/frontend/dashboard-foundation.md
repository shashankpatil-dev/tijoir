# Tijoir Frontend Dashboard Foundation

## Goal

Refactor the frontend from page-local flows into a reusable SaaS dashboard that supports the current product slice cleanly:

- authentication
- vault secrets
- share links
- public recipient access

This work is intentionally focused on information architecture, reusable UI primitives, predictable state, and cleaner spacing. It is not a cosmetic-only pass.

## Product Shape

The app should feel like a security operations SaaS:

- a clear public landing page
- separate auth routes
- an authenticated organization workspace
- a public recipient route for share links

The dashboard should present status first, then actions, then detail.

## Route Structure

Public routes:

- `/`
- `/login`
- `/signup`
- `/verify`
- `/access`

Protected routes:

- `/dashboard`
- `/dashboard/overview`
- `/dashboard/vault`
- `/dashboard/share-links`
- `/dashboard/vendors`
- `/dashboard/organization`
- `/dashboard/audit`
- `/dashboard/settings`
- `/dashboard/recipient`

This route split is now implemented, and the main route-level ownership cleanup
has been completed for vault, share links, and organization flows.

## Dashboard Information Architecture

### Top Bar

Required items:

- product mark
- organization name and slug
- environment or session status
- global quick actions
- current user identity and role
- logout action

Top bar should stay compact and fixed to the dashboard shell, not repeated inside feature sections.

### Sidebar

Initial sidebar items:

- `Overview`
- `Vault`
- `Share Links`
- `Recipient View`

Future sidebar items:

- `Members`
- `Vendors`
- `Audit Log`
- `Policies`
- `Settings`

The current implementation should render only sections that are backed by working APIs.

### Overview Screen

The overview section should contain:

- stat cards
- session summary
- active secret count
- active share-link count
- recent workspace message
- primary actions

It should help the user understand the workspace state before they enter detailed operations.

### Vault Screen

The vault section should support:

- secret list table
- selected secret details
- create secret dialog
- generate value dialog
- reveal action
- rotate action
- revoke action

### Share Links Screen

The share-link section should support:

- share-link table
- create share-link dialog
- link preview card
- revoke action
- metadata and consume URLs

### Recipient View Screen

This stays available in the dashboard for operator testing, but it should be visually secondary to the public `/access` page.

## Reusable Component Set

### Shell Components

- `DashboardShell`
- `DashboardSidebar`
- `DashboardTopbar`
- `DashboardContent`
- `DashboardSectionHeader`

### Layout and Surface Components

- `SurfaceCard`
- `StatCard`
- `EmptyState`
- `PageSection`
- `DetailList`

### Data Components

- `DataTable`
- `StatusBadge`
- `ActionMenu` or row action group
- `KeyValueGrid`

### Feedback Components

- `ToastProvider`
- `InlineAlert`
- `BusyOverlay`
- `SkeletonBlock`
- `SkeletonTable`

### Overlay Components

- `Dialog`
- `ConfirmDialog`

### Form Components

- shared text, textarea, password, select fields
- button variants
- dialog form footer actions

## UX Rules

### Spacing

- prefer tighter vertical rhythm in the dashboard
- avoid large blank zones between cards and tables
- keep section headers, filters, tables, and forms visually grouped
- avoid nested large-radius cards where a flat section works better

### Tables

Tables should be the default pattern for vault and share inventory.

Required behavior:

- stable columns
- row hover state
- selected row state where relevant
- empty state
- loading skeleton

### Status and Badges

Use consistent badge colors for:

- `ACTIVE`
- `REVOKED`
- `CONSUMED`
- `EXPIRED`
- `VIEW_ONCE`
- `VIEW_UNTIL_REVOKED`
- `ROTATION_NOTIFY_ONLY`

### Dialogs

Use dialogs for:

- create secret
- generate value
- rotate secret
- create share link
- confirm revoke

Danger actions should use explicit confirm copy with the target name visible.

### Feedback

Use:

- toast poppers for non-blocking success or failure
- inline alerts for page or section level problems
- overlay only for blocking async work

Do not use persistent debug or response boxes in normal flows.

### Refresh and Session Behavior

Required behavior:

- protected routes restore the session before rendering workspace content
- access token refresh should happen automatically through the frontend auth client
- dashboard state should survive refresh where practical
- stale cache should never block live fetches

## State Management

Current status:

- session behavior is centralized through auth hooks and storage helpers
- dashboard shell state is separated from feature hooks
- feature hooks exist for:
  - workspace core
  - vault
  - share links
  - members
  - recipient access
- React Query is now onboarded

Current caching model:

- dashboard read datasets are query-backed
- major vault/share/member writes are mutation-backed
- local storage cache still exists as a restore fallback, not the final truth model

Remaining improvements:

- improve auth/session storage security model
- add optimistic updates where they help perceived speed
- add production timing instrumentation and route-level performance review

So the frontend is past the “just local React state” stage now. The next work is
refinement, not first adoption.

## Current Gaps

- no optimistic updates yet
- no production timing instrumentation yet
- no browser-level responsive QA evidence captured for every dashboard route yet

## Latest Progress Snapshot

Completed:

- dashboard shell and shared primitives
- feature-first folder structure
- route-specific dashboard pages
- workspace provider/context
- query provider
- query-backed dashboard reads
- mutation-backed core operational actions
- extracted form state hooks
- extracted action hooks and query utility modules
- split large share-link and organization route composites into focused sections

Still pending:

- stronger session storage model
- performance verification against production interactions
- browser QA across mobile and tablet breakpoints

## Styling Strategy

Keep the existing configurable theme tokens in `globals.css`.

Primary design direction:

- white base surfaces
- blue brand and focus accents
- restrained shadows
- compact operational density

Theme tokens should remain the source of truth for:

- background
- surface
- border
- brand
- muted text
- sidebar colors

## Implementation Order

1. create reusable dashboard shell
2. create shared dashboard primitives
3. tighten global spacing and section sizing
4. rebuild vault screen on the new shell
5. rebuild share-links screen on the new shell
6. leave recipient flow working, but lighter weight
7. split internal sections into dedicated dashboard routes

## Explicit Non-Goals For This Pass

- full design system package migration
- member management UI
- vendor management UI
- audit log UI
- animation-heavy polish

Those should come after the shell and current feature flows are stable.

## Shadcn Decision

Shadcn UI is optional, not required.

For this pass, the fastest safe path is:

- keep Tailwind and local components
- mirror the same compositional discipline a shadcn-based setup would give
- avoid dependency churn unless a specific primitive is genuinely missing

That keeps the refactor smaller and easier to verify while still leaving room to adopt shadcn-style patterns later.
