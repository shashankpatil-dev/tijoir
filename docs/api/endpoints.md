# Tijoir API — Endpoints

Actual REST surface (Spring Boot backend). All paths are prefixed `/api`. All non-public
endpoints require a Bearer access token; public endpoints are marked. This reflects the
implemented controllers — there is **no** `/api/connections` / `/api/contracts` surface
(vendor contracts live under `/api/vendors`), and there are no MFA endpoints.

## Auth — `/api/auth`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | public | rate-limited per IP |
| POST | `/login` | public | rate-limited per IP + failure limit |
| POST | `/google/exchange` | public | verifies Google ID token; returns session or `needsOrganization=true` |
| POST | `/google/register` | public | creates org + session from verified Google identity |
| POST | `/google/link` | bearer | link Google identity to current account |
| POST | `/refresh` | public | refresh cookie or body; rotates the refresh token |
| POST | `/logout` | bearer | revokes the refresh token, clears cookie |
| GET  | `/me` | bearer | current user + org |
| PATCH | `/me` | bearer | update profile name |
| POST | `/switch-organization` | bearer | switches active organization in current session |
| POST | `/password/change` | bearer | change password |
| POST | `/password/forgot` | public | password reset request |
| POST | `/password/reset` | public | password reset confirm |
| POST | `/verify-email` | public | rate-limited per IP + per token |
| POST | `/resend-verification` | public | rate-limited per IP + per email |

## Organization — `/api/organization`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `/members` | bearer | page/size/query/role |
| PATCH| `/members/{memberId}/role` | manager | |
| DELETE | `/members/{memberId}` | manager | soft-delete (deactivate) |
| GET  | `/invites` | manager | page/size/query/role/status |
| POST | `/invites` | manager | |
| POST | `/invites/{inviteId}/revoke` | manager | |
| POST | `/invites/accept` | public | accept an invite token |
| GET  | `/policy` | bearer | org policy |
| PUT  | `/policy` | manager | update org policy |

## Secrets — `/api/secrets`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `` | secret-manager | create |
| POST | `/generate` | secret-manager | generate a candidate value |
| GET  | `` | bearer | page/size/query/type/status |
| GET  | `/{secretId}` | bearer | detail (metadata) |
| GET  | `/{secretId}/versions` | bearer | version history (metadata only, no values) |
| POST | `/{secretId}/reveal` | secret-manager | returns plaintext; `Cache-Control: no-store`; audited |
| POST | `/{secretId}/revoke` | secret-manager | |
| POST | `/{secretId}/rotate` | secret-manager | appends a new version |

## Share Links — `/api/share-links`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `` | share-manager | returns the raw token ONCE (never retrievable again) |
| GET  | `` | share-manager | page/size/query/permission/status |
| POST | `/{shareLinkId}/revoke` | share-manager | |

## Public Share Links — `/api/public/share-links` (no auth)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/quick` | create anonymous one-time quick-share; rate-limited per IP |
| GET  | `/manage/{manageToken}` | creator-side quick-share status; rate-limited per IP + per token |
| POST | `/manage/{manageToken}/revoke` | revoke anonymous quick-share before/after read; rate-limited per IP + per token |
| GET  | `/{token}` | public metadata; rate-limited per IP + per token |
| POST | `/{token}/consume` | reveal/consume; one-time for VIEW_ONCE (DB pessimistic lock); rate-limited |

## Vendors — `/api/vendors`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `` | vendor-manager | list |
| POST | `` | vendor-manager | create vendor; optional `linkedOrganizationSlug` enables counterparty handshake |
| GET  | `/{vendorId}` | vendor-manager | detail |
| GET  | `/{vendorId}/contracts` | vendor-manager | list contracts |
| POST | `/{vendorId}/contracts` | vendor-manager | create access contract (see note) |
| GET  | `/incoming-contracts` | vendor-manager | list contracts proposed to the current org as counterparty |
| POST | `/contracts/{contractId}/accept` | vendor-manager | counterparty org accepts a proposed contract |
| POST | `/{vendorId}/contracts/{contractId}/revoke` | vendor-manager | |
| POST | `/{vendorId}/offboard` | vendor-manager | revokes active contracts + vendor share links |

> **Vendor contract model (current):**
> - plain CRM vendors still create contracts directly as `ACTIVE`
> - if a vendor is linked to another onboarded org through `linkedOrganizationSlug`, contracts
>   start as `PROPOSED`
> - the linked counterparty org must accept before the contract becomes `ACTIVE`
> - grant creation and vendor share-link creation stay blocked until the contract is active
> - status enum: `PROPOSED / ACTIVE / REVOKED / EXPIRED`

## Audit — `/api/audit-events`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `` | audit-reader | page/size/query/action/resourceType |
| GET  | `/report` | audit-reader | aggregates |
| GET  | `/export` | audit-reader | CSV; `Cache-Control: no-store` |

## Notifications — `/api/notifications`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `` | bearer | page/size |
| POST | `/{notificationId}/read` | bearer | mark one read (no mark-all endpoint yet) |

## Dashboard — `/api/dashboard`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `/summary` | bearer | counts + latest secret |

## Health — `/api/health`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `` | public | liveness |

_Role terms: manager = ORG_OWNER/ADMIN; secret-manager/share-manager/vendor-manager = OWNER/ADMIN/MEMBER; audit-reader = OWNER/ADMIN/AUDITOR. Enforced server-side in the service layer._
