# Tijoir Frontend

Next.js static frontend for the Tijoir MVP auth flow and future dashboard.

## Runtime Config

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

For production, build with the Lambda Function URL:

```bash
NEXT_PUBLIC_API_BASE_URL="$(cd ../infra/terraform/envs/prod && terraform output -raw backend_function_url)" npm run build
```

Use Node 22. The repository includes `.nvmrc`, and CI also builds with Node 22.

## Current Screen

The first screen is an auth console:

```text
register organization owner
verify email with MVP token
login after verification
refresh /api/auth/me
```

Email delivery is not wired yet. Until SES or another provider is added, the backend returns the verification token directly.

## Planned Areas

```text
auth          login, register, email verification
dashboard     organization overview
secrets       vault list, create, rotate
share-links   create and manage public share links
connections   partner connections and offboarding
contracts     integration contracts and shared secrets
audit         audit log viewer
```
