# Tijoir

Secure vendor credential exchange platform for organization-to-organization secret sharing.

## Project Layout

```text
tijoir/
  backend/      Spring Boot modular monolith
  frontend/     Next.js dashboard and public share pages
  infra/        Docker, local services, and cloud notes
  docs/         Product spec, architecture, API, and security documentation
  scripts/      Local developer scripts
```

Full product and architecture spec: [docs/product-spec.md](docs/product-spec.md)

## MVP Backend Scope

```text
1. Auth and email verification
2. Organization and RBAC
3. Secret Vault backed by AWS Secrets Manager in production
4. One-time public share links
5. Organization connections
6. Integration contracts
7. Contract secret permissions
8. Append-only audit logs
9. Secret rotation
10. Vendor offboarding
```

## Local Services

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## Local Auth App

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
nvm use
npm install
npm run dev
```

The frontend reads `NEXT_PUBLIC_API_BASE_URL`. For local development it defaults to `http://localhost:8080`.

Email delivery is intentionally out of the current scope. In this MVP, the registration API returns `emailVerificationToken` directly so the flow can be tested without SES or another paid provider. Before real customer use, replace that response with email delivery and stop exposing the raw token to the browser.

## Production Infra

Production AWS infrastructure lives in:

```text
infra/terraform/
```

Local and staging-style testing should stay local until the MVP backend is stable.

Terraform apply is allowed only from the `main` branch workflow. Other branches should use pull requests for plan review.

## Production Deploy Order

```bash
# 1. First Terraform apply has already created base infra with backend Lambda disabled.

# 2. Manual path: push a backend Lambda image.
./scripts/push-backend-image.sh ap-south-1 <git-sha-or-version>

# 3. In GitHub repo variables, set:
# BACKEND_IMAGE_TAG=<git-sha-or-version>
# ENABLE_BACKEND_LAMBDA=true
# Optional after CloudFront exists:
# ALLOWED_CORS_ORIGINS_JSON=["https://<frontend-cloudfront-domain>"]

# 4. Run the Terraform Production workflow on main.

# 5. Deploy the static frontend. It auto-reads backend_function_url from Terraform output.
./scripts/deploy-frontend-static.sh
```

The CI production path is:

```text
pull_request:
  backend changes  -> backend tests + coverage
  frontend changes -> frontend static build
  infra changes    -> terraform fmt/init/validate/plan only

main:
  backend changes  -> backend tests, build Lambda image, push ECR, terraform apply with github.sha image tag
  frontend changes -> frontend build, sync S3 bucket, invalidate CloudFront
  infra changes    -> terraform fmt/init/validate/plan/apply
```

The current production endpoints are:

```text
backend  -> Lambda Function URL in ap-south-1
frontend -> CloudFront distribution backed by the frontend S3 bucket
```
