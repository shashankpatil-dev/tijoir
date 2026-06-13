# Tijoir Terraform

Terraform is only for the production AWS environment.

Local and staging-style development stay local with Docker Compose. Do not create separate AWS staging resources until the MVP backend is stable.

## Production AWS Shape

```text
Frontend:
S3 private bucket + CloudFront

Backend:
AWS Lambda container image + Lambda Function URL

Database:
RDS PostgreSQL in private subnets

Security controls:
DynamoDB PAY_PER_REQUEST table for locks, rate limits, and short-lived security state

Secret payload storage:
AWS Secrets Manager + KMS

Container registry:
ECR backend repository
```

## Why Not EC2

No EC2 instance is used for application hosting. The backend runs as a Lambda container and the frontend is static hosting through S3/CloudFront.

RDS is still used because the application needs PostgreSQL. It is managed AWS infrastructure, not self-managed EC2.

Cost notes: [COST_NOTES.md](COST_NOTES.md)

## Apply Order

1. Bootstrap Terraform state in `bootstrap/`.
2. Configure the prod backend in `envs/prod/backend.tf`.
3. First prod apply with `enable_backend_lambda = false`.
4. Build and push backend image to ECR.
5. Set `enable_backend_lambda = true` and `backend_image_tag` to the pushed tag.
6. Apply prod again to create the Lambda function.
7. Deploy the frontend static export to S3.

```bash
# From the repository root:
./scripts/push-backend-image.sh ap-south-1 <image-tag>
./scripts/deploy-frontend-static.sh
```

The frontend deploy script uses `NEXT_PUBLIC_API_BASE_URL` when set. If not set, it reads `backend_function_url` from Terraform output after the Lambda exists.

## MVP Email Verification

SES/email delivery is intentionally excluded from the current cost scope. The backend stores only a SHA-256 hash of the email verification token, but the raw token is returned once from registration/resend so the MVP can be demoed without paid email delivery.

Before real customer usage:

```text
1. Add SES or another transactional email provider.
2. Email the raw verification token as a link.
3. Remove the raw token from API responses.
4. Add email delivery failure handling and resend throttling.
```

## GitHub Actions

Production Terraform automation is branch-gated:

```text
pull_request -> init, validate, plan only
main push    -> init, validate, plan, apply
```

Backend image deployment is also branch-gated:

```text
pull_request backend changes -> tests and coverage only
main backend changes         -> tests, ECR push, Terraform apply with the pushed image tag
```

Workflow notes: [../../docs/infra/terraform-github-actions.md](../../docs/infra/terraform-github-actions.md)
