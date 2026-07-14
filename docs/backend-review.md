# Tijoir Backend Review — 5 Axes

_Reviewed post-frontend-upgrade. Backend: Spring Boot 3.3, Java 21, ~7,450 LOC / 140 files, Postgres + Flyway (V1–V11), in-memory security state, synchronous email. Verdict: well-architected core, tenant isolation genuinely sound, a few deployment-gating security defaults must be fixed before any non-local deploy, and the vendor "contract" model does not match the stated Phase-1 scope._

---

## 0. Headline

| Axis | State | Must-fix count |
|------|-------|----------------|
| Application / functionality | Solid; endpoints ↔ frontend tightly aligned; one scope mismatch | 1 decision + 3 adds |
| User-trust security | Strong foundations (isolation, hashing, reveal audit); 4 deploy-gating gaps | 4 gating |
| Platform hardening (malicious users) | Good RBAC + consume guard; rate-limiter trivially bypassable | 2 high |
| Infra alignment | Code is in-memory-only; terraform still provisions Redis + DynamoDB (orphaned) | trim + 1 constraint |
| DB schema / migrations | Healthy; strong indexes; no boot-blockers; V11 MFA drop safe | minor |

The single most important operational fact: **rate-limiting and the share-link consume guard are in-memory, single-instance only.** Deploy on ONE instance, or they break (see Infra §4).

---

## 1. Application / Functionality

**Endpoint alignment: excellent.** All 27 REST endpoints are consumed by the frontend; no dead endpoints, no missing endpoints vs what the frontend calls. Thin controllers → `@Service` → JPA `Specification` filtering, uniform across domains. `GlobalExceptionHandler` solid (429 w/ Retry-After, 401 generic, 400 field errors, 500 no stack leak).

### Gaps
1. **Vendor "mutual-accept contract" does NOT exist — contradicts `SCOPE_PHASE1.md`.** `VendorAccessContractStatus` has only `ACTIVE/REVOKED/EXPIRED` — no `PROPOSED`/`ACCEPTED`. `VendorService.createContract` persists directly as `ACTIVE`, single-sided. A `Vendor` is a CRM record (name/contact/notes), **not a platform tenant** — there is no counterparty to accept. The scope says "vendor = another onboarded org; both sides accept." **Decision required:** either (a) build the real handshake (needs a counterparty identity model + `proposed→accepted-by-both→active` state machine), or (b) accept single-sided "vendor access grants" for Phase 1 and correct the scope/naming. Recommend (b) for Phase 1, (a) as a Phase-2 epic.
2. **No secret version-history read endpoint.** Rotation writes `SecretVersion` rows (append-only, unique `(secret_id, version_number)`), but there's no `GET /secrets/{id}/versions`. Data persisted, unreadable. Cheapest high-value add.
3. **Rotation notifications inert.** `ContractPermission.ROTATION_NOTIFY_ONLY` and `OrganizationPolicy.rotationReminderDays` exist but `rotate()` emits nothing and no scheduler acts on the reminder. Wire it or drop the config.
4. **`DashboardSummaryService.evict()` is a no-op** called from 4 services — cache ceremony implying caching that doesn't exist. Delete it + call sites (or implement real caching). Also `getSummary` runs 6 queries with **no `@Transactional`** — add `readOnly=true`.
5. **`endpoints.md` is stale/misleading** — documents a `/api/connections` + `/api/contracts` mutual-accept design and `rotation-history` that were never built. Rewrite or delete.

### Keep
Share-link create/consume/revoke (+ public metadata), offboard cascade (revokes contracts + share links), pagination/filter Specifications, auth flow, centralized `OrganizationAuthorizationService`.

### Trim
No-op `evict()`; near-empty `rotation` + `contract` packages; `GET /vendors/{id}` (no FE consumer); stale `endpoints.md`.

---

## 2. Security — User Trust (protecting legitimate users)

**Confirmed strong:** tenant isolation (every query org-scoped by JWT `org_id`, verified — no path for org A → org B data); refresh-token rotation + one-time-use + hash-only storage; email-verification gate on login/refresh; AES-256-GCM with fresh per-message IV (no nonce reuse); reveal is POST-only + tenant-scoped + audited; no secret values in logs or audit; audit append-only in practice.

### Deployment-gating (fix before ANY non-local deploy)
- **A8 — HIGH — reveal endpoint missing `Cache-Control: no-store`.** `POST /api/secrets/{id}/reveal` returns plaintext with no cache headers (public-share + audit-export controllers set it; the primary reveal doesn't). Security doc requires it. Add `CacheControl.noStore()` + `Pragma: no-cache`.
- **B15 — HIGH — refresh cookie `Secure` defaults to `false`, `SameSite=Lax`.** If deployed without `REFRESH_COOKIE_SECURE=true`, refresh token goes over plaintext HTTP. Default Secure=true, SameSite=Strict (cookie is only sent to `/api/auth/refresh|logout`).
- **B16 — MED/HIGH — `expose-dev-tokens` defaults to `true`.** register/resend return the raw email-verification token in the response body → verification bypass if it reaches staging/prod. Default `false`, local-only.
- **A1/A7 — MED — weak committed default secrets.** `JWT_SECRET` default is a 25-byte committed string (< 256-bit → forgeable tokens = full cross-tenant compromise if env unset); `LOCAL_SECRET_ENCRYPTION_KEY` default committed; AES key derived via single unsalted SHA-256. Fail startup if either is default/too short; enforce ≥256-bit JWT key.

### Other
- A5 — bcrypt cost = default 10 → bump to 12.
- A3a — no refresh reuse-detection / no optimistic lock → concurrent double-refresh could double-issue. Add `UPDATE ... WHERE consumed_at IS NULL` guard.
- A6 — access JWTs can't be invalidated pre-expiry (15-min TTL) — acceptable for MVP, document.
- A13 — audit append-only not enforced at DB layer → `REVOKE UPDATE, DELETE ON audit_events` from the app role for evidentiary integrity.

---

## 3. Security — Platform Hardening (malicious users)

**Confirmed strong:** server-side RBAC on every mutation (`require*` in services, not UI-gated); AUDITOR/VIEWER correctly excluded from reveal; share-link token entropy 192-bit + hash-only + one-time consume with **DB pessimistic lock** (the real cross-instance guard); parameterized queries (no injection); DTO binding (no mass-assignment); restrictive CORS; errors don't leak internals.

### High
- **B3 — rate limiter trusts spoofable `X-Forwarded-For`.** `ClientIpResolver` takes the first XFF token unconditionally → attacker sets a random XFF per request → **bypasses every rate limit** (login brute-force, consume, verification). Only honor XFF from trusted proxies (`server.forward-headers-strategy` / right-most trusted hop), else `getRemoteAddr()`. **This neutralizes most of the abuse protection until fixed.**
- **B4 — rate limiter fails OPEN.** Any store exception → request allowed. Fail closed for login-failure + consume scopes.

### Medium
- **B5 — no per-account login throttle**; login is per-IP only (200/10min), and `recordSuccessfulLogin` is a no-op so failure counter never resets. Add per-email failure limit + lockout/backoff.
- **B11** — `VIEW_UNTIL_REVOKED` links are bearer credentials (reusable by anyone with the URL until revoked); only per-token rate-limited. Matches the permission model — make it explicit in product copy.
- **B18** — minor user-enumeration: `resendVerification` returns 404 "User not found" for unknown emails; login is already generic. Return generic success.
- **B14** — no max-length on secret values → memory-abuse vector. Add a bound in the DTOs.

---

## 4. Infra Alignment

Code is now **fully in-memory** — no Redis/DynamoDB usage anywhere (rate-limit store + consume guard both `ConcurrentHashMap`). Yet the terraform still provisions the removed dependencies.

### Trim (orphaned — code no longer uses these)
- `infra/terraform/envs/prod/elasticache.tf` (Redis) — unused.
- `infra/terraform/envs/prod/dynamodb.tf` — unused; drop `SECURITY_CONTROL_TABLE_NAME` env + the DynamoDB VPC endpoint + related SG.
- Config drift: any remaining `tijoir.redis.*` / MFA / idempotency / cache env vars in `lambda.tf` / `application.yml` (most were cut; sweep for stragglers).
- `Dockerfile.lambda` + ECR only if you drop the Lambda-container path (see below).

### Keep
RDS Postgres, KMS + Secrets Manager (DB creds + prod secret payloads), S3/CloudFront for the static frontend.

### CRITICAL constraint — single instance
In-memory rate-limit + consume guard are **per-JVM**. Consequences:
- **Multiple replicas / Lambda concurrency** → rate limits multiply per instance (a 10/min limit becomes 10×N) and are effectively defeated. (The one-time *consume* is still safe cross-instance because it's guarded by the DB `PESSIMISTIC_WRITE` lock, not the in-memory guard — but the rate limits are not.)
- **Phase-1 rule: deploy exactly ONE always-on instance** (single small container/VM), NOT Lambda (which spins many concurrent instances). Combined with the XFF bypass (B3), Lambda + current code = no working rate limiting at all.
- Before horizontal scaling, reintroduce a shared store (Redis) behind the existing `SecurityControlStore` interface — the interface was deliberately kept for this.

Recommended minimal Phase-1 infra: RDS + one container (plain `Dockerfile`, not Lambda) + KMS/Secrets Manager + S3/CloudFront. Matches the deferred `backend-infra-phase1-cleanup.md` Part I.

---

## 5. DB Schema / Migrations

**Healthy. No `ddl-auto: validate` boot-blockers.** V11 drops the MFA columns and `UserAccount` maps none → boot safe. All enum VARCHAR columns have comfortable headroom (longest constant well under column width). 11 migrations, ~25 FK constraints.

**Indexes — comprehensive on hot paths** (verified): composite `(org_id, created_at DESC)` on `audit_events`, `secrets`, `share_links`, `vendors`; `secret_versions(secret_id)`; `share_links(secret_id)`, `(vendor_id, status, created_at)`, `(contract_id)`; `vendor_access_contracts(org_id, status, created_at)` + `(vendor_id, created_at)`; `refresh_tokens(user_id)` + `(expires_at)`; `notification_records(user, created_at)`; `organization_invites(org_id, created_at)`; `users(org_id)`; `organization_policies(org_id)`; `email_verification_tokens(user_id)`. No obvious missing index.

**Unique constraints — correct:** `share_links.token_hash`, `secrets(org_id, secret_key)`, `secret_versions(secret_id, version_number)`, refresh/verification `token_hash`, org `slug`, one policy per org (`org_id UNIQUE`).

**Tenant scoping in schema:** tenant column is `org_id` (not `organization_id`), present + indexed on all tenant-owned tables. Good.

### Notes (minor, forward migrations V12+ only — never edit V1–V11)
- `users.email` is **GLOBAL unique**, not per-org. Means one human/email = one org account; the same email can't join two orgs. Fine given "vendor = separate onboarded org," but flag as a product constraint (blocks a person being a member of multiple orgs later).
- Audit append-only is app-level only — add DB `REVOKE UPDATE/DELETE` (ties to A13).
- If the vendor model stays single-sided (§1), the "contract" tables are fine; if the handshake is built, add `PROPOSED/ACCEPTED` status + accepted-by columns in a V12 migration.

---

## 6. Prioritized Action List

**Before any non-local deploy (gating):**
1. A8 — `no-store` on reveal.
2. B15 — refresh cookie Secure=true / SameSite=Strict default.
3. B16 — `expose-dev-tokens=false` default.
4. A1/A7 — fail startup on default/weak `JWT_SECRET` + `LOCAL_SECRET_ENCRYPTION_KEY`.

**High (abuse defense):**
5. B3 — trusted-proxy XFF resolution.
6. B4 — rate limiter fail-closed for auth/consume.
7. Deploy on ONE instance (infra §4) until a shared store is added.

**Functionality:**
8. Add `GET /secrets/{id}/versions`.
9. Decide vendor model (single-sided grant vs real handshake); fix scope/docs accordingly.
10. Remove no-op `evict()`; add `@Transactional(readOnly)` to dashboard summary; rewrite `endpoints.md`.

**Medium/hardening:** B5 per-account throttle; A5 bcrypt→12; A3a refresh reuse-detect; B19 upgrade Spring Boot 3.3.x/AWS SDK + add OWASP dependency-check; B14 secret max-length; A13 DB-level audit immutability; trim orphaned terraform (Redis/DynamoDB).
