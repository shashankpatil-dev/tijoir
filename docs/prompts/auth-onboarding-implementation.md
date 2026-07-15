# Auth & Onboarding — Implementation Plan

> Executes `docs/auth-onboarding-scope.md`. Ordered so each task ends at an independently testable deliverable. Backend tasks gate on `cd backend && mvn test`; frontend tasks gate on `cd frontend && npx tsc --noEmit && npm run build`. Commit after each task.

**Goal:** Ship two-step signup, Google sign-in (self-built), password reset, invite-via-Google, and Account/Org settings — one org per user, SES-backed email.

**Architecture:** Keep the existing Spring Boot custom-JWT auth. Add Google by verifying a GIS `id_token` server-side against Google's JWKS (no server redirect — fits the static frontend). All new auth code sits behind `AuthService`/a small `GoogleTokenVerifier` so a future provider swap stays additive.

**Tech stack:** Spring Boot 3.3 / Java 21 / Postgres / Flyway; Next.js 15 static export / React 19 / Google Identity Services.

## Global constraints
- One org per user (`users.org_id`, email globally unique). No multi-org.
- Additive Flyway only (`V12+`); never edit `V1`–`V11`.
- Secure-by-default: prod requires real secrets; dev profile supplies dev values.
- No SSO/SAML/SCIM, MFA, magic link, first-run checklist, billing.
- Colors/fonts unchanged; reuse shadcn primitives + `site-chrome` auth components.

---

## Task order (dependency-aware)
0. DB migration `V12` (reset tokens + Google columns)
1. Password reset — backend
2. Password reset — frontend (`/forgot`, `/reset`)
3. Two-step signup UI + drop org-email
4. Google sign-in — backend (verify + exchange/register/link)
5. Google sign-in — frontend (GIS on login/signup + invite accept)
6. Account & Organization settings

---

### Task 0: Migration V12 — reset tokens + Google columns

**Files:**
- Create: `backend/src/main/resources/db/migration/V12__auth_google_and_password_reset.sql`
- Modify: `backend/.../organization/UserAccount.java` (add `googleSub`, make `passwordHash` nullable)

**SQL:**
```sql
alter table users add column google_sub varchar(255);
alter table users add constraint uq_users_google_sub unique (google_sub);
alter table users alter column password_hash drop not null;

create table password_reset_tokens (
    id uuid primary key,
    user_id uuid not null references users(id),
    token_hash varchar(64) not null unique,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null
);
create index idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
```

**Steps:**
- [ ] Add the migration file above.
- [ ] In `UserAccount`: add `@Column(name = "google_sub") private String googleSub;` + getter/`linkGoogle(sub)`; change `passwordHash` column to `nullable = true`.
- [ ] `mvn test` — the boot/`validate` step + existing tests must pass (entity ↔ V12 aligned). Expected: green.
- [ ] Commit `feat(auth): V12 — google_sub + nullable password + password_reset_tokens`.

---

### Task 1: Password reset — backend

**Files:**
- Create: `backend/.../auth/PasswordResetToken.java`, `PasswordResetTokenRepository.java`
- Create DTOs: `auth/dto/ForgotPasswordRequest.java` (`@Email String email`), `ResetPasswordRequest.java` (`@NotBlank String token, @Size(min=10) String newPassword`)
- Modify: `AuthService.java` (+`requestPasswordReset`, `resetPassword`), `AuthController.java` (+2 endpoints), `notification/email/EmailTemplateFactory.java` (+reset template), `securitycontrol/PhaseOneSecurityPolicies.java` + `AuthSecurityService.java` (rate-limit scopes)
- Test: `backend/src/test/java/com/tijoir/auth/AuthControllerIntegrationTest.java`

**Interfaces (Produces):**
- `POST /api/auth/password/forgot {email}` → 200 always (generic).
- `POST /api/auth/password/reset {token, newPassword}` → 200; consumes token, sets hash, revokes all refresh tokens.

**Behavior mirrors `EmailVerificationToken`** (same hash-at-rest, TTL, consume pattern).

**Steps:**
- [ ] `PasswordResetToken` entity (mirror `EmailVerificationToken`: id, user, tokenHash, expiresAt, consumedAt, createdAt; `@PrePersist`; `isUsable()`; `consume()`), repo `findByTokenHash`.
- [ ] `AuthService.requestPasswordReset(email)`: look up user; if present, create token (raw = `CryptoUtil.randomUrlToken`, store `sha256Hex`), send email via `EmailSender` with link `${APP_PUBLIC_BASE_URL}/reset?token=<raw>`. Always return void (caller responds generically). Rate-limit `auth-password-forgot-ip` + `-email`.
- [ ] `AuthService.resetPassword(token, newPassword)`: hash lookup, `isUsable()` else 400; set `passwordHash = encoder.encode(newPassword)`; `consume()`; revoke all refresh tokens for user; audit `PASSWORD_RESET` (add enum value).
- [ ] Controller endpoints returning the generic 200 for forgot.
- [ ] Add fail-open/closed scope names to `RateLimitEnforcer` FAIL_CLOSED set if sensitive (`auth-password-forgot-*`).
- [ ] Integration test: register+verify a user → forgot → (dev token exposed) → reset → old refresh rejected, login with new password works.
- [ ] `mvn test` green. Commit `feat(auth): password reset flow`.

---

### Task 2: Password reset — frontend

**Files:**
- Create: `frontend/src/app/forgot/page.tsx`, `frontend/src/app/reset/page.tsx`
- Modify: `frontend/src/features/auth/api/auth.api.ts` (+`forgotPassword`, `resetPassword`), `frontend/src/app/login/page.tsx` (add "Forgot password?" link)

**Steps:**
- [ ] `auth.api.ts`: `forgotPassword(email)` → POST `/api/auth/password/forgot`; `resetPassword(token,newPassword)` → POST `/api/auth/password/reset`.
- [ ] `/forgot`: `AuthShell` + email field + submit → generic success toast ("If that email exists, we sent a link").
- [ ] `/reset`: read `?token=`, new-password field, submit → success → redirect `/login`.
- [ ] Login: add `/forgot` link next to the form.
- [ ] `npx tsc --noEmit && npm run build` green. Commit `feat(web): forgot/reset password pages`.

---

### Task 3: Two-step signup + drop org-email

**Files:**
- Modify: `frontend/src/app/signup/page.tsx` (two-step wizard, remove org-email field)
- Modify: `backend/.../auth/dto/RegisterRequest.java` (drop `organizationEmail`; default org contact = owner email in `AuthService.register`), `AuthService.register`
- Test: `AuthControllerIntegrationTest` register case updated

**Steps:**
- [ ] Backend: remove `organizationEmail` from `RegisterRequest`; in `register`, set org email = `userEmail`. Keep atomic org+owner creation.
- [ ] Update the existing register integration test to the new payload.
- [ ] `mvn test` green.
- [ ] Frontend signup: step 1 (name, email, password) → step 2 (organization name) → submit combined payload to `/api/auth/register`. A back button on step 2. Reuse `AuthShell`/`AuthFormHeader`.
- [ ] `tsc + build` green. Commit `feat(auth): two-step signup, drop org-email`.

---

### Task 4: Google sign-in — backend

**Files:**
- Create: `backend/.../auth/security/GoogleTokenVerifier.java` (verify id_token: fetch+cache Google JWKS `https://www.googleapis.com/oauth2/v3/certs`, check signature/`aud`/`iss`/`exp`, return {sub, email, name, emailVerified})
- Create DTOs: `GoogleExchangeRequest` (`idToken`), `GoogleRegisterRequest` (`idToken`, `organizationName`)
- Modify: `AuthService` (+`googleExchange`, `googleRegister`, `linkGoogle`), `AuthController` (+3 endpoints), config `application.yml` (`tijoir.security.google-client-id: ${GOOGLE_CLIENT_ID:}`)
- Test: `AuthControllerIntegrationTest` with a stubbed verifier (inject a test `GoogleTokenVerifier` bean returning a fixed identity)

**Interfaces (Produces):**
- `POST /api/auth/google/exchange {idToken}` → `AuthResponse` (existing user) OR `{ needsOrganization: true }`.
- `POST /api/auth/google/register {idToken, organizationName}` → `AuthResponse` (creates org + owner, `emailVerifiedAt=now`, `googleSub` set).
- `POST /api/auth/google/link {idToken}` (authenticated) → links `googleSub` to current user.

**Steps:**
- [ ] `GoogleTokenVerifier` with JWKS fetch + cache (use AWS SDK URL client already present, or `java.net.http`). Validate `aud == google-client-id`, `iss in {accounts.google.com, https://accounts.google.com}`, `exp`.
- [ ] `AuthService.googleExchange(idToken)`: verify → find user by `googleSub`; else by `email` → link + return session; else `needsOrganization`.
- [ ] `AuthService.googleRegister(idToken, orgName)`: verify → reject if email already a user (one-org) → create org+owner (verified, googleSub) → session.
- [ ] Controller endpoints. Make the verifier an interface so tests inject a stub.
- [ ] Integration tests (stubbed verifier): new google user → needsOrganization → register → session; existing email → linked login.
- [ ] `mvn test` green. Commit `feat(auth): google sign-in (server-verified id_token)`.

---

### Task 5: Google sign-in — frontend

**Files:**
- Create: `frontend/src/features/auth/components/google-button.tsx` (loads GIS, renders button, returns `id_token`)
- Modify: `login/page.tsx`, `signup/page.tsx` (add button + `needsOrganization` → step 2), `invite/page.tsx` (accept via Google), `auth.api.ts` (+google calls), `.env.example` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`)

**Steps:**
- [ ] `GoogleButton` component: inject GIS script, render, `onToken(idToken)` callback. Guard when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset (hide button).
- [ ] Login: button → `google/exchange` → save session / redirect.
- [ ] Signup: button → `google/exchange`; if `needsOrganization`, show step 2 (org name) → `google/register`.
- [ ] Invite accept: "Continue with Google" → `invites/accept {token, idToken}`.
- [ ] `tsc + build` green. Commit `feat(web): google sign-in buttons`.

---

### Task 6: Account & Organization settings

**Files:**
- Modify backend: `AuthController` (+`PATCH /api/auth/me` name, `POST /api/auth/password/change`), `OrganizationController` (+`PUT /api/organization` name), services, `AuditAction` (+`PASSWORD_CHANGED`, `ORGANIZATION_RENAMED`)
- Modify frontend: `features/settings/*` — Account tab (name, change password, connected Google) + Organization tab (org name); wire to endpoints.
- Test: integration tests for change-password (wrong current → 400) + org rename (non-manager → 403).

**Steps:**
- [ ] Backend: `changePassword(userId, current, next)` — verify current hash, set new, revoke refresh tokens; `updateName`; `renameOrganization` (manager only). Endpoints + validation.
- [ ] Integration tests (wrong current password 400; viewer renames org 403).
- [ ] `mvn test` green.
- [ ] Frontend settings: Account tab form (name, change password, Google connect status/button) + Organization tab (rename, managers only). Reuse shadcn `Card`, form fields, sonner toasts.
- [ ] `tsc + build` green. Commit `feat(settings): account + organization settings`.

---

## Config to set (ops)
- Dev: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + backend `GOOGLE_CLIENT_ID` (a Google OAuth Web client). Without it, Google buttons hide — email/password still works.
- Prod (`lambda.tf`): `GOOGLE_CLIENT_ID`; SES verified sender + production access for real emails.

## Verification per task
- Backend: `cd backend && mvn test` (boots context on `test` profile → validates entity↔schema).
- Frontend: `cd frontend && npx tsc --noEmit && npm run build`.
- Manual core loops after Task 5: email signup→verify→login; forgot→reset; google signup→org→dashboard; invite→accept(google/password).

## Self-review notes
- Covers every scope item: signup(3), google(4,5), reset(1,2), invites-google(5), settings(6), SES (existing sender + Task 1/config), V12 (0). 
- One-org rule enforced in `googleRegister` + invite accept (reject cross-org email).
- No placeholders; each task ends testable and committable.
