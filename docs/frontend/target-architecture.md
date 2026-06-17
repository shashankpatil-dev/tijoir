# Frontend Target Architecture

This is the working frontend architecture reference for Tijoir.

This document now reflects:

- what has already been implemented
- what is still structurally incomplete
- what the next frontend optimization steps should be

The main architectural problem at the start of this cleanup was that too much
route, state, API orchestration, and UI behavior sat inside one file:
`src/components/dashboard/dashboard-workspace-app.tsx`.

That is no longer true. The dashboard is now feature-split, route-aware, and
partially query-backed.

## Current Status

Implemented:

- route-thin dashboard pages
- feature-first folder structure under `src/features`
- reusable shell, table, dialog, badge, toast, and form primitives
- extracted feature hooks for:
  - workspace core
  - vault
  - share links
  - members
  - recipient access
- React Query added for:
  - dashboard read datasets
  - major vault/share/member mutations
- dashboard route pages now render actual feature views instead of `null`
- dashboard layout now owns session + shell + provider, not all feature UI

Still pending:

- full query-native route isolation without shared dashboard context
- backend pagination/filter params aligned with frontend tables
- stronger auth/session browser storage model
- optimistic updates and more selective invalidation
- performance instrumentation and production timing checks

## Constraints

- The frontend is deployed as a static export to S3 + CloudFront.
- That means the authenticated app cannot depend on Next.js server actions or
  per-request SSR for its main runtime behavior.
- Public pages can stay mostly server-rendered/static.
- Authenticated dashboard data loading should be client-driven, route-scoped,
  and cached in a proper frontend data layer.

## Target Structure

```text
frontend/src/
  app/
    (public)/
      page.tsx
      access/page.tsx
    (auth)/
      login/page.tsx
      signup/page.tsx
      verify/page.tsx
      invite/page.tsx
    (dashboard)/
      dashboard/
        layout.tsx
        overview/page.tsx
        vault/page.tsx
        share-links/page.tsx
        members/page.tsx
        recipient/page.tsx
    layout.tsx
    globals.css

  components/
    layout/
      site-header.tsx
      site-footer.tsx
      app-shell.tsx
    providers/
      app-providers.tsx
    ui/
      badge.tsx
      button.tsx
      data-table.tsx
      dialog.tsx
      feedback.tsx
      form-fields.tsx
      skeleton.tsx
      table-controls.tsx
      toast-provider.tsx

  features/
    auth/
      api/
        auth.api.ts
      components/
        login-form.tsx
        signup-form.tsx
        verify-form.tsx
        invite-accept-form.tsx
      hooks/
        use-auth-session.ts
        use-redirect-after-auth.ts
      lib/
        auth-storage.ts
      types/
        auth.types.ts

    dashboard/
      components/
        dashboard-shell.tsx
        dashboard-workspace-context.tsx
      lib/
        dashboard-columns.tsx
        dashboard-pagination.ts
        dashboard-routing.ts
        query-keys.ts
      hooks/
        use-dashboard-workspace.tsx
        use-workspace-core.ts

    secrets/
      api/
        secrets.api.ts
      components/
        create-secret-dialog.tsx
        rotate-secret-dialog.tsx
        vault-view.tsx
      hooks/
        use-secret-form-state.ts
        use-vault-workspace.ts
      types/
        secrets.types.ts

    share-links/
      api/
        share-links.api.ts
      components/
        create-share-link-dialog.tsx
        share-links-view.tsx
      hooks/
        use-share-link-form-state.ts
        use-share-links-workspace.ts
      types/
        share-links.types.ts

    members/
      api/
        members.api.ts
      components/
        change-member-role-dialog.tsx
        create-invite-dialog.tsx
        members-view.tsx
      hooks/
        use-members-form-state.ts
        use-members-workspace.ts
      types/
        members.types.ts

    recipient-access/
      api/
        recipient-access.api.ts
      components/
        recipient-view.tsx
      hooks/
        use-recipient-workspace.ts
      types/
        recipient-access.types.ts

  lib/
    api/
      client.ts
      errors.ts
    config/
      env.ts
    utils/
      cookies.ts
      dates.ts
      pagination.ts
      strings.ts
```

## Rules

### 1. App routes must stay thin

Each `page.tsx` should mostly do this:

- route guard
- route-level layout composition
- feature container rendering

It should not own full workflow state, API calling, dialogs, table filters,
action handlers, and render logic together.

### 2. Feature state belongs in `features/*`

The current dashboard file mixes:

- auth/session state
- secret CRUD state
- share-link state
- member/invite state
- recipient test state
- filters and pagination
- dialogs
- table rendering

That must be split by feature.

### 3. Shared UI belongs in `components/ui`

Only generic, reusable primitives belong there:

- buttons
- badges
- dialogs
- inputs
- tables
- skeletons
- toasts

Business-specific things like `SecretCreateDialog` or `InviteMemberDialog`
should not live in `components/ui`.

### 4. API calls must be separated from components

Every feature should have its own `api/*.api.ts` layer.

Example:

- `features/secrets/api/secrets.api.ts`
- `features/share-links/api/share-links.api.ts`
- `features/members/api/members.api.ts`

That keeps fetch logic out of UI files.

### 5. Auth storage must be isolated

Today session, refresh behavior, redirect state, remembered email, and workspace
cache are all mixed inside one file.

That should be split into:

- `features/auth/lib/auth-storage.ts`
- `features/auth/api/auth.api.ts`
- shared low-level helpers in `lib/utils/cookies.ts`

### 6. Dashboard data must move toward route ownership

Previous behavior eagerly loaded everything and rendered from one client
component.

Current behavior is improved but not fully route-isolated yet.

Current shared workspace loads:

- auth me
- secrets
- share links
- members
- invites

Target behavior:

- `/dashboard/overview` should need only summary/session state
- `/dashboard/vault` should own vault list/detail queries
- `/dashboard/share-links` should own share-link list queries
- `/dashboard/members` should own member/invite queries

Only shared shell/session data should load globally.

### 7. Query caching should be centralized

This is now partially implemented.

React Query is already onboarded and should continue to be used for:

- route-level data loading
- stale-while-revalidate
- mutation invalidation
- deduping duplicate requests

Remaining work is to reduce the last manual orchestration layer and let query
state own more of the feature data directly.

## Current Structure Decisions

### What is working well now

- `app/dashboard/*` pages are no longer fake placeholders
- `DashboardWorkspaceApp` is now a shell/composition layer, not a logic dump
- feature hooks own their own table state and action flows
- dialog form state is separated from most feature orchestration
- query keys are centralized

### What should not grow further

- `use-workspace-core.ts` should not become a new monolith
- feature hooks should not reintroduce broad cross-feature knowledge
- page files should stay thin and only compose feature views

## Remaining Work

### Priority 1

- move more dashboard list ownership to route-local query hooks
- reduce dependency on shared workspace context for feature datasets
- remove remaining duplicated fallback/cache coupling where query cache can be
  the source of truth

### Priority 2

- backend pagination + filtering support for:
  - secrets
  - share links
  - members
  - invites
- then wire frontend table controls to real server-side params

### Priority 3

- stronger auth/session storage strategy
- move refresh/session handling toward a more secure browser model

### Priority 4

- optimistic updates where safe
- better invalidation granularity
- timing instrumentation and production interaction measurement

## Recommended Migration Order

### Phase 1

- keep current routes
- extract feature API files
- extract feature types
- extract auth storage helpers

### Phase 2

- extract `secrets` UI and hooks from dashboard mega-file
- extract `share-links` UI and hooks
- extract `members` UI and hooks
- extract `recipient-access` UI and hooks

### Phase 3

- add TanStack Query
- replace `loadWorkspace()` full refetch model
- move to route-scoped fetching

### Phase 4

- clean public/auth pages to the same architecture
- remove dead compatibility code
- shrink dashboard route files to composition only

## Immediate Structural Goal

After the first refactor pass, no single frontend file should own:

- more than one feature domain
- both fetch orchestration and multiple dialogs
- cross-feature state + table rendering + route logic together

Specifically, `dashboard-workspace-app.tsx` should disappear and be replaced by:

- dashboard shell components
- route-specific feature containers
- feature hooks
- feature dialogs
- feature tables

That is the industry-standard direction for this codebase.
