# Terraform Bootstrap

Creates the S3 bucket and DynamoDB table used by Terraform remote state.

Run this once per AWS account/region:

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

After apply, copy the `backend_config` output into:

```text
infra/terraform/envs/prod/backend.tf
```

## GitHub Actions Role

To let GitHub Actions run Terraform without AWS access keys, set:

```hcl
create_github_actions_role = true
github_repository          = "YOUR_GITHUB_OWNER/YOUR_REPO"
```

Then run:

```bash
terraform apply
terraform output github_actions_role_arn
```

Use that output as the GitHub secret:

```text
AWS_ROLE_ARN
```
