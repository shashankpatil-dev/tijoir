# Initial API Groups

## Auth

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/verify-email
POST /api/auth/resend-verification
GET  /api/auth/mfa/status
POST /api/auth/mfa/enroll/start
POST /api/auth/mfa/enroll/confirm
POST /api/auth/mfa/verify
POST /api/auth/mfa/disable
```

## Secrets

```http
POST /api/secrets
GET  /api/secrets
GET  /api/secrets/{id}
POST /api/secrets/generate
POST /api/secrets/{id}/revoke
POST /api/secrets/{id}/rotate
GET  /api/secrets/{id}/rotation-history
```

## Share Links

```http
POST /api/secrets/{id}/share-link
GET  /api/public/share/{token}/metadata
POST /api/public/share/{token}/reveal
POST /api/share-links/{id}/revoke
```

## Connections

```http
GET  /api/organizations/search?query=
POST /api/connections/request
POST /api/connections/{id}/accept
POST /api/connections/{id}/reject
POST /api/connections/{id}/revoke
GET  /api/connections
```

## Contracts

```http
POST /api/contracts
GET  /api/contracts
GET  /api/contracts/{id}
POST /api/contracts/{id}/secrets
GET  /api/contracts/{id}/secrets
POST /api/contracts/{id}/secrets/{secretId}/reveal
POST /api/contracts/{id}/secrets/{secretId}/revoke
```
