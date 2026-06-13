# Terraform GitHub Actions

Terraform production changes are controlled by branch.

## Rules

```text
Pull requests:
- terraform fmt
- terraform init
- terraform validate
- terraform plan
- no apply

Push to main:
- terraform fmt
- terraform init
- terraform validate
- terraform plan
- terraform apply

Manual run from main:
- terraform fmt
- terraform init
- terraform validate
- terraform plan
- terraform apply

Other branches:
- no apply
```

## Required GitHub Secrets

Configure these in the GitHub repository:

```text
AWS_ROLE_ARN      IAM role assumed by GitHub Actions through OIDC
TF_STATE_BUCKET   S3 bucket created by infra/terraform/bootstrap
TF_LOCK_TABLE     DynamoDB lock table created by infra/terraform/bootstrap
```

`AWS_ROLE_ARN` must be only the raw role ARN:

```text
arn:aws:iam::123456789012:role/tijoir-github-actions-terraform
```

Do not paste:

```text
github_actions_role_arn = "arn:aws:iam::123456789012:role/tijoir-github-actions-terraform"
"arn:aws:iam::123456789012:role/tijoir-github-actions-terraform"
tijoir-github-actions-terraform
null
```

`AWS_ROLE_ARN` can be created by setting this in `infra/terraform/bootstrap/terraform.tfvars`:

```hcl
create_github_actions_role = true
github_repository          = "YOUR_GITHUB_OWNER/YOUR_REPO"
```

Then run bootstrap apply and copy:

```bash
terraform output github_actions_role_arn
```

## Required GitHub Variables

Configure these repository variables:

```text
AWS_REGION              ap-south-1
BACKEND_IMAGE_TAG       bootstrap initially, then your pushed image tag
ENABLE_BACKEND_LAMBDA   false initially, true after backend image is pushed
```

## Important

The workflow intentionally applies only on `main`.

Do not store AWS access keys in GitHub secrets for this project. Use AWS OIDC with `AWS_ROLE_ARN`.
