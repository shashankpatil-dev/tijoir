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

## GitHub Actions

Production Terraform automation is branch-gated:

```text
pull_request -> init, validate, plan only
main push    -> init, validate, plan, apply
```

Workflow notes: [../../docs/infra/terraform-github-actions.md](../../docs/infra/terraform-github-actions.md)
