# Production Terraform

This stack is intentionally production-only.

## Resources

- VPC with public and private subnets
- RDS PostgreSQL in private subnets
- DynamoDB table for locks/rate limits/temporary security state
- KMS key
- AWS Secrets Manager database secret and app secret namespace
- ECR backend repository
- Optional Lambda backend container
- S3 private frontend bucket
- CloudFront distribution

## First Apply

```bash
cp backend.tf.example backend.tf
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Keep `enable_backend_lambda = false` during the first apply because the backend image does not exist in ECR yet.

## After Backend Image Push

Update `terraform.tfvars`:

```hcl
backend_image_tag     = "your-image-tag"
enable_backend_lambda = true
```

Then:

```bash
terraform plan
terraform apply
```

