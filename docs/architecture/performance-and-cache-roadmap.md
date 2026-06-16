# Performance And Cache Roadmap

This document captures the current state of backend and frontend caching, the main reasons the product feels slow, and the next improvement cycle.

## Current State

### Backend

What exists now:

- PostgreSQL is the source of truth for auth, membership, vault metadata, share links, and audit records.
- Redis is configured in the application config.
- Public share-link endpoints return `Cache-Control: no-store`.
- Core list tables already have basic organization-scoped indexes.

What does not exist yet:

- No service-level cache for workspace metadata.
- No Redis-backed security lock for one-time share consumption.
- No response caching for safe metadata endpoints.
- No backend pagination for secrets, share links, members, or invites.
- No explicit API timing or performance instrumentation.

### Frontend

What exists now:

- Browser HTTP caching is effectively disabled for API calls by using `fetch(..., { cache: "no-store" })`.
- Session state is persisted in local storage with a cookie fallback.
- Workspace state is cached in local storage per organization slug.
- Cached workspace is shown first, then live API refresh runs in the background.

What does not exist yet:

- No query library such as TanStack Query for request deduping, stale-time control, background refresh, and mutation invalidation.
- No route-level data loading separation; the dashboard still performs a broad workspace fetch.
- No in-memory access-token model; auth state is stored in browser-accessible storage.
- No incremental optimistic updates for most mutations.

## Where The Product Feels Slow

The main perceived latency is currently caused more by frontend orchestration than raw backend complexity.

### Main frontend bottlenecks

1. Full workspace refresh
   - The dashboard loads `/api/auth/me`, `/api/secrets`, `/api/share-links`, `/api/organization/members`, and `/api/organization/invites` together.
   - This happens on initial session restore and again after many mutations.

2. Broad reload after actions
   - Create, rotate, revoke, invite, and member changes often call the full workspace loader again instead of updating only the affected state.

3. Blocking loading UX
   - A broad busy overlay is shown for workspace refreshes and action flows.
   - This makes the app feel slower than it actually is.

4. No paginated list APIs
   - All tables currently pull full collections.
   - This is manageable in small data volumes, but it will degrade quickly as real usage grows.

### Main backend bottlenecks

1. No pagination or server-side filtering on core list endpoints.
2. No Redis-backed lock for public one-time consume semantics.
3. No metadata caching layer for low-risk read paths.
4. No observability for slow-query or slow-endpoint analysis.

## Security View Of Caching

### Backend

Caching secret values in the backend should remain extremely conservative.

Safe candidates for caching:

- non-sensitive workspace metadata
- member lists
- invite lists
- organization summaries
- derived counts for dashboards

Unsafe or high-risk cache targets:

- revealed secret payloads
- consumed share-link values
- refresh token material
- raw public share tokens

### Frontend

Current frontend state persistence is functional but not the final secure shape.

Current risks:

- refresh token is still accessible to JavaScript
- full session object is persisted in local storage
- cached workspace is stored in local storage without sensitivity boundaries

Target design:

- refresh token in HttpOnly + Secure cookie
- access token kept in memory
- only low-risk workspace metadata persisted locally
- no revealed secret values persisted in browser storage

## Priority Improvements

### Next backend cycle

1. Add paginated list endpoints
   - secrets
   - share links
   - members
   - invites

2. Add server-side filtering and sorting
   - status
   - type
   - role
   - created date

3. Add Redis-backed one-time consume hardening
   - short-lived consume lock
   - duplicate consume protection
   - race-condition tests

4. Add performance instrumentation
   - request timing
   - slow endpoint logging
   - database timing visibility

5. Add selective metadata caching
   - only for non-sensitive, org-scoped read models
   - short TTL
   - explicit invalidation on mutation

### Next frontend cycle

1. Move refresh token to secure cookie flow
   - backend-set HttpOnly cookie
   - frontend stops persisting raw refresh token

2. Keep access token in memory
   - remove long-lived browser storage dependence for active auth

3. Introduce TanStack Query
   - route-level query keys
   - stale-while-revalidate behavior
   - automatic deduping
   - targeted invalidation after mutations

4. Stop broad workspace reload after every action
   - update only affected tables or records
   - refetch only the minimal dependent queries

5. Improve loading behavior
   - skeletons for first load
   - inline row or section refresh states
   - no global blocking overlay for ordinary reloads

## Concrete Work Plan

### Period 1

- secure auth persistence redesign
- TanStack Query onboarding
- route-scoped dashboard data loading

### Period 2

- backend pagination and filters
- frontend table integration with paginated APIs
- targeted mutation invalidation

### Period 3

- Redis one-time consume guard
- performance instrumentation
- overview KPIs backed by lightweight read models

## Definition Of Done For This Improvement Cycle

The product should feel materially faster when all of these are true:

- page refresh does not trigger a heavy full-dashboard blocking experience
- login survives token expiry through secure refresh flow
- create, rotate, revoke, invite, and member changes update quickly without full workspace reload
- vault, share-link, member, and invite tables use paginated APIs
- public share consume is protected against duplicate concurrent use
- low-risk metadata loads are measurably faster and observable
