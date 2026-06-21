# Redis, Notifications, and Auth Workplan

This document is the working reference for the next product pass across three
connected tracks:

1. Redis expansion for security and performance control
2. SES-backed transactional notifications with minimal cloud cost
3. Authentication simplification and a dedicated organization profile flow

It is intentionally practical. The goal is to define what should be built next,
what should remain out of scope, and how each area should fit the existing
Tijoir architecture.

## Why This Work Exists

The current MVP is functionally broad enough to demonstrate:

- organization onboarding
- role-based access control
- vault secret storage
- share links
- vendor connections and contracts
- audit records

But the current product shape still has three important gaps:

1. Redis is only used for public share-link consume locking, while several
   other security-control responsibilities still need a proper distributed
   store.
2. Email and notification delivery are still stub-level. Verification and
   invite flows expose tokens directly instead of behaving like a production
   system.
3. Signup, login, and organization/profile management are still heavier and
   more developer-shaped than they should be for a real multi-tenant SaaS flow.

## Current State Summary

### Redis

What exists now:

- Production Redis is provisioned for the backend.
- Redis is used for:
  - public share-link consume locking
  - auth and public-link rate limiting
  - auth and public-link abuse cooldowns
  - idempotent replay protection for selected mutation APIs
- Local and test environments use in-memory Redis-compatible stores outside
  production.

What does not exist yet:

- no dashboard summary cache
- no organization-policy cache
- no MFA challenge state

### Notifications and Email

What exists now:

- email verification tokens exist in the database
- invite tokens exist in the database
- backend returns verification and invite tokens directly
- a lightweight notification package namespace exists

What does not exist yet:

- no SES integration
- no email sender abstraction
- no production-safe verification email flow
- no production-safe invite email flow
- no in-app notification persistence and delivery flow

### Authentication and Organization Profile

What exists now:

- login uses only email and password
- signup asks for:
  - organization name
  - organization email
  - owner name
  - owner email
  - password
- backend issues:
  - short-lived access token
  - refresh token in an `HttpOnly` cookie
- frontend still persists session state in browser storage
- organization profile is mixed with members and invites inside the same
  workspace area

What is not ideal yet:

- signup is longer than it should be
- verification flow is developer-oriented
- access token handling is still too browser-storage heavy
- organization profile is not a dedicated SaaS-style settings surface
- Google OAuth is not present, but the current product flow is not yet ready
  for it either

## Workstream 1: Redis Expansion

## Goals

Redis should be used only where it clearly improves one of these:

- distributed correctness
- short-lived security control
- request protection
- safe low-risk metadata caching

Redis must not become the source of truth for durable business records.

## Redis Flag Model

The backend should expose explicit flags so each Redis responsibility can be
enabled or disabled independently.

Recommended config shape:

```text
tijoir.redis.enabled
tijoir.redis.share-link-lock.enabled
tijoir.redis.rate-limit.enabled
tijoir.redis.idempotency.enabled
tijoir.redis.summary-cache.enabled
tijoir.redis.policy-cache.enabled
tijoir.redis.abuse-protection.enabled
tijoir.redis.mfa.enabled
```

These flags should be read in backend configuration classes, not scattered as
raw environment lookups across business services.

## What Redis Should Be Used For

### 1. Share-link consume locking

Already implemented and should remain.

Use case:

- protect `VIEW_ONCE` links against duplicate concurrent consume attempts
- prevent race conditions across multiple Lambda instances

Data shape:

- key: hashed share token
- TTL: short, around 30 seconds

### 2. Rate limiting

This is the next highest-value Redis use.

Endpoints to cover first:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `POST /api/auth/resend-verification`
- `POST /api/auth/verify-email`
- `GET /api/public/share-links/{token}`
- `POST /api/public/share-links/{token}/consume`

Recommended dimensions:

- per normalized email
- per source IP
- per token hash for public share-link probing

Expected behavior:

- bounded request windows
- clear `429 Too Many Requests` responses
- response body should explain retry timing

### 3. Abuse protection

This should sit beside rate limiting, not replace it.

Use cases:

- repeated failed login attempts
- repeated verification-token guessing
- repeated invite-token guessing
- repeated public share-link probing

Recommended Redis records:

- failed-attempt counters
- cooldown markers
- lock-window expiry markers

This is security control state, not durable product data.

### 4. Idempotency keys

This is the next operationally valuable Redis responsibility.

Candidate mutation endpoints:

- create secret
- rotate secret
- create share link
- create vendor
- create contract
- invite member
- offboard vendor

Why:

- frontend retries should not create duplicates
- Lambda or client retries should not double-submit mutations

Model:

- require `Idempotency-Key` header for selected writes
- bind stored result to:
  - caller identity
  - organization
  - route
  - request body hash
- TTL can be moderate, for example 24 hours

### 5. Dashboard summary cache

Redis can help the dashboard feel faster, but only for low-risk summary data.

Cache only:

- vault object counts
- active share-link counts
- vendor counts
- pending invite counts
- member counts
- recent audit preview counts or top items

Do not cache full sensitive datasets by default.

TTL:

- 15 to 30 seconds

Invalidation:

- explicit invalidation on relevant mutations

### 6. Organization policy cache

This is a small, safe cache candidate.

Cache target:

- organization policy read model

TTL:

- around 60 seconds

Invalidation:

- delete on policy update

### 7. MFA challenge store

This should be introduced only when MFA or step-up verification is added.

Good fit for Redis because challenge state is:

- short-lived
- retry-sensitive
- security-critical
- not long-term business data

Expected contents:

- challenge id
- hashed code or challenge secret
- user id
- organization id
- attempt counter
- expiry

## What Redis Must Not Store

The following are explicitly out of scope for Redis:

- revealed secret payloads
- decrypted secret values
- raw passwords
- raw share-link tokens
- refresh tokens as the system of record
- long-lived RBAC decisions
- audit records themselves

## Recommended Delivery Order For Redis

### Phase 1

Status: completed

- rate limiting
- abuse protection

### Phase 2

Status: completed

- idempotency keys

### Phase 3

Status: next

- dashboard summary cache
- policy cache

### Phase 4

Status: pending

- MFA challenge store

## Testing Requirements For Redis Work

- unit tests for key policy and TTL behavior
- integration tests for:
  - login limit exceeded
  - public share consume limit exceeded
  - duplicate idempotent mutation replay
  - summary cache invalidation after mutation
- failure-path tests:
  - Redis unavailable
  - Redis timeout
  - flag disabled fallback behavior

## Workstream 2: SES and Notifications

## Goal

Move verification and invite delivery from token-returning development behavior
to a production-safe transactional email flow, while keeping AWS cost minimal.

## Minimal-Cost Principle

SES should be used only for transactional messages that are necessary for the
product to function correctly.

Do not use SES for noisy or non-critical events in the MVP.

## What SES Should Handle First

### 1. Email verification

Required because:

- onboarding should not rely on raw token exposure
- sensitive actions already depend on verified email status

### 2. Resend verification

Required because:

- users will commonly lose or expire the original verification link

### 3. Organization invite delivery

Required because:

- member onboarding should not rely on the owner manually copying an invite
  token from the UI

## What SES Should Not Handle Yet

Out of scope for the next pass:

- secret rotation emails for every event
- share-link notifications to all users
- audit event emails
- general digest emails
- broad alerting emails

Those should wait until the notification model is stable.

## Product Notification Model

Tijoir should separate:

1. notification records
2. email delivery

These are related, but not the same thing.

Recommended shape:

- `NotificationEvent` or similar domain object
- database notification record for in-app history
- optional email delivery projection for selected event types

The event should drive both:

- in-app notification creation
- optional transactional email delivery

## Backend Design

Introduce an email abstraction:

```text
EmailSender
  - NoopEmailSender
  - SesEmailSender
```

Recommended behavior:

- local and test use `NoopEmailSender`
- production uses `SesEmailSender`
- business services emit events or delivery requests, not SES SDK calls

Suggested first templates:

- verify email
- resend verification
- organization invite

Template inputs should contain only:

- recipient email
- recipient name if available
- organization name
- verification or invite URL
- expiry timestamp

Never include:

- secret payloads
- passwords
- share-link revealed values
- raw vault contents

## API Behavior Changes Needed

Current backend returns verification and invite tokens directly.

That should change for production-facing flows:

- registration should return workflow status, not raw verification token
- resend verification should return workflow status, not raw verification token
- invite creation should return invite record metadata, not raw invite token in
  the normal owner UI flow

Local and test can keep access to raw tokens behind a development profile or
test-only path if needed.

## Infra and Config Requirements

Production configuration will eventually need:

- SES sender identity
- SES region handling
- sender email address
- optional template names
- feature flag for email delivery enabled/disabled

Suggested flags:

```text
tijoir.notifications.enabled
tijoir.notifications.email.enabled
tijoir.notifications.email.provider=ses|noop
tijoir.notifications.email.verification.enabled
tijoir.notifications.email.invites.enabled
```

## Testing Requirements

- unit tests for email payload generation
- integration tests for:
  - register sends verification request
  - resend verification sends a new verification request
  - invite creation triggers invite email workflow
- no-op provider tests for local/test
- failure-path tests for SES errors and retry-safe behavior

## Workstream 3: Authentication and Organization Profile Simplification

## Goal

Make onboarding and login feel like a clean multi-tenant SaaS product:

- short signup
- simple login
- clear separation between account identity and organization identity
- dedicated organization profile/settings area after entering the dashboard

## Multi-Tenant Model To Keep

The current core model is the right one for the MVP:

- `Organization` is the tenant
- `UserAccount` belongs to one organization
- roles are organization-scoped
- vault, vendor, contract, share-link, and audit records are organization-scoped

This should stay.

For now, keep user email globally unique across the system. That is simpler for
the MVP and reduces account-resolution ambiguity.

## Login Shape

Keep login minimal:

- email
- password

No extra organization field should be required on login.

Reason:

- lower friction
- backend already supports this
- cleaner tenant entry flow

## Signup Shape

The current signup asks for both organization email and owner email. That is
more than the user should need on the first screen.

Recommended signup form:

- full name
- work email
- organization name
- password

Optional advanced field:

- organization contact email

If the user does not provide organization contact email:

- backend should default the organization contact email to the owner email

That keeps onboarding short while preserving the organization record.

## Backend Contract Direction

Recommended registration request shape:

```text
organizationName
userName
userEmail
password
organizationEmail?   optional
```

Behavior:

- if `organizationEmail` is missing, use `userEmail`
- create organization
- create owner
- send verification email
- return workflow status

## Verification Flow Direction

The current flow is still developer-shaped.

Target behavior:

- user signs up
- user gets verification email
- user opens verification link
- frontend confirms verification state
- user is redirected to login or directly into the workspace if that flow is
  intentionally supported

The production UI should not depend on raw verification token display.

## Auth Storage Direction

Current state:

- refresh token already uses `HttpOnly` cookie
- frontend still persists session state in browser storage

Target state:

- refresh token remains in `HttpOnly`, `Secure`, `SameSite` cookie
- access token kept primarily in memory
- only low-risk session hints persisted locally if needed
- no long-lived full session object in `localStorage`

This matters because current frontend persistence is still too exposed for the
final security shape.

## Google OAuth Position

Google OAuth should not be the next auth feature.

It should wait until:

- email/password onboarding is clean
- invite/member flows are stable
- verification flow is production-safe
- account and organization profile separation is complete

Why:

- OAuth adds callback and identity-linking complexity
- invite acceptance becomes harder
- multi-tenant membership resolution becomes more subtle

Recommended position:

- defer Google OAuth until after core onboarding cleanup
- add it as an optional sign-in method, not the primary dependency

## Dedicated Profile Surfaces

The product should separate:

### 1. Account page

User-level concerns:

- name
- email
- role
- verification state
- password change later
- session/security details later

### 2. Organization page

Tenant-level concerns:

- organization name
- contact email
- slug read-only
- organization domain later
- members
- invites
- org policy

The current organization area mixes profile, members, and invites too closely.
It should become a true settings-oriented SaaS surface.

## Frontend UX Direction

### Public auth flow

- landing page explains product
- top-right actions are login and signup
- login page is short
- signup page is short
- verification page handles email verification state

### Authenticated flow

- redirect directly to dashboard after successful login
- account/profile work should happen after entering the product
- organization settings should be a dedicated destination, not a side effect of
  onboarding

## Suggested Route Shape

```text
/login
/signup
/verify
/dashboard/overview
/dashboard/account
/dashboard/organization
/dashboard/settings
```

`/dashboard/account` and `/dashboard/organization` should become distinct
surfaces instead of one overloaded area.

## What Should Be Deferred

Do not expand scope with these yet:

- enterprise SSO
- SAML
- SCIM
- multi-organization user switching
- passwordless magic links
- Google OAuth as mandatory primary auth

## Recommended Execution Order Across All Three Workstreams

### Step 1

Redis hardening:

- rate limiting
- abuse protection
- config flags

### Step 2

Auth cleanup:

- simplify signup contract
- simplify signup UI
- define dedicated account and organization pages

### Step 3

Email delivery foundation:

- email sender abstraction
- SES production provider
- verification and invite transactional templates

### Step 4

Redis operational improvements:

- idempotency keys
- summary cache
- policy cache

### Step 5

Later auth hardening:

- stronger in-memory access-token handling
- MFA challenge store in Redis
- optional Google OAuth after core flows are stable

## Immediate Decisions Captured Here

The following decisions are intentionally fixed for the next pass:

1. Redis should expand, but only into short-lived control and low-risk cache
   responsibilities.
2. SES should be introduced only for transactional verification and invite
   delivery first.
3. Signup should become shorter by making organization contact email optional.
4. Login should stay email + password only.
5. Account profile and organization profile should be separated.
6. Google OAuth should be deferred until the core auth and invite model is
   cleaner.

## Definition Of Done For This Work Package

This package is in a good state when:

- Redis powers rate limiting and abuse protection cleanly behind flags
- idempotency design is in place for selected write endpoints
- production no longer exposes verification or invite tokens in normal UI flows
- SES can send verification and invite emails through a provider abstraction
- signup is reduced to the minimal SaaS-friendly form
- login remains simple
- organization profile becomes a dedicated dashboard surface
- account/profile concerns are separated from organization/member operations
