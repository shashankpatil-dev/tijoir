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
| POST | `/refresh` | public | refresh cookie or body; rotates the refresh token |
| POST | `/logout` | bearer | revokes the refresh token, clears cookie |
| GET  | `/me` | bearer | current user + org |
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
| GET  | `/{token}` | public metadata; rate-limited per IP + per token |
| POST | `/{token}/consume` | reveal/consume; one-time for VIEW_ONCE (DB pessimistic lock); rate-limited |

## Vendors — `/api/vendors`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `` | vendor-manager | list |
| POST | `` | vendor-manager | create vendor (CRM record) |
| GET  | `/{vendorId}` | vendor-manager | detail |
| GET  | `/{vendorId}/contracts` | vendor-manager | list contracts |
| POST | `/{vendorId}/contracts` | vendor-manager | create access contract (see note) |
| POST | `/{vendorId}/contracts/{contractId}/revoke` | vendor-manager | |
| POST | `/{vendorId}/offboard` | vendor-manager | revokes active contracts + vendor share links |

> **Vendor contract model (Phase 1):** contracts are **single-sided access grants** created
> directly as `ACTIVE` by the owning org. There is no `proposed → accepted-by-both → active`
> mutual-accept handshake and no counterparty tenant — a `Vendor` is a CRM record, not a
> platform org. A real bilateral handshake is a Phase-2 item (needs a counterparty identity
> model). Status enum: `ACTIVE / REVOKED / EXPIRED`.

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
