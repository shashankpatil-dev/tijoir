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

## Production Infra

Production AWS infrastructure lives in:

```text
infra/terraform/
```

Local and staging-style testing should stay local until the MVP backend is stable.

Terraform apply is allowed only from the `main` branch workflow. Other branches should use pull requests for plan review.
