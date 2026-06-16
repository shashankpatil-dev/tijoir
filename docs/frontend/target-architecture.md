# Frontend Target Architecture

This is the target structure for the Tijoir frontend going forward.

The main problem today is not missing components. It is that too much route,
state, API orchestration, and UI behavior sits inside one file:
`src/components/dashboard/dashboard-workspace-app.tsx`.

We should move to a route-thin, feature-first structure.

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
        dashboard-header.tsx
        dashboard-sidebar.tsx
        dashboard-stat-cards.tsx
      lib/
        dashboard-nav.ts

    secrets/
      api/
        secrets.api.ts
      components/
        secret-create-dialog.tsx
        secret-detail-panel.tsx
        secret-list-table.tsx
        secret-reveal-dialog.tsx
        secret-rotate-dialog.tsx
        secret-revoke-dialog.tsx
      hooks/
        use-secrets-query.ts
        use-secret-detail-query.ts
        use-secret-actions.ts
      lib/
        secret-filters.ts
      types/
        secrets.types.ts

    share-links/
      api/
        share-links.api.ts
      components/
        share-link-create-dialog.tsx
        share-link-list-table.tsx
        share-link-preview-card.tsx
        share-link-revoke-dialog.tsx
      hooks/
        use-share-links-query.ts
        use-share-link-actions.ts
      types/
        share-links.types.ts

    members/
      api/
        members.api.ts
      components/
        invite-member-dialog.tsx
        invite-list-table.tsx
        member-list-table.tsx
        member-remove-dialog.tsx
        member-role-dialog.tsx
      hooks/
        use-members-query.ts
        use-invites-query.ts
        use-member-actions.ts
      types/
        members.types.ts

    recipient-access/
      api/
        recipient-access.api.ts
      components/
        recipient-access-card.tsx
        recipient-secret-reveal-card.tsx
      hooks/
        use-public-share-metadata.ts
        use-public-share-consume.ts
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

### 6. Dashboard data must load by route, not all at once

Current behavior eagerly loads:

- auth me
- secrets
- share links
- members
- invites

for the whole workspace on mount.

Target behavior:

- `/dashboard/overview` loads overview data
- `/dashboard/vault` loads vault data
- `/dashboard/share-links` loads share-link data
- `/dashboard/members` loads members/invites

Only shared shell/session data should load globally.

### 7. Query caching should be centralized

We should add TanStack Query and use it for:

- route-level data loading
- stale-while-revalidate
- mutation invalidation
- deduping duplicate requests

This is the correct replacement for the current manual full-workspace reload
pattern.

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
