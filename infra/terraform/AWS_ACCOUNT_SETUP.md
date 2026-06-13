# Connect Terraform To Your AWS Account

## 1. Install Required CLIs

Install:

```text
aws cli v2
terraform
docker
```

Verify:

```bash
aws --version
terraform -version
docker --version
```

## 2. Configure AWS Credentials

Recommended for a personal project:

```bash
aws configure
```

Enter:

```text
AWS Access Key ID
AWS Secret Access Key
Default region name: ap-south-1
Default output format: json
```

Verify the account:

```bash
aws sts get-caller-identity
```

## 3. Create Terraform Remote State

```bash
cd infra/terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set a globally unique bucket name:

```hcl
state_bucket_name = "tijoir-terraform-state-yourname-2026"
```

Then:

```bash
terraform init
terraform plan
terraform apply
```

## 4. Configure Production Backend State

Copy:

```bash
cd ../envs/prod
cp backend.tf.example backend.tf
cp terraform.tfvars.example terraform.tfvars
```

Edit `backend.tf` using the bootstrap output values.

## 5. First Production Apply

Keep this in `terraform.tfvars`:

```hcl
enable_backend_lambda = false
backend_image_tag     = "bootstrap"
```

Then:

```bash
terraform init
terraform plan
terraform apply
```

This creates AWS base infra and the ECR repository.

## 6. Push Backend Image

From project root:

```bash
./scripts/push-backend-image.sh ap-south-1 first-prod
```

## 7. Enable Backend Lambda

Update `infra/terraform/envs/prod/terraform.tfvars`:

```hcl
backend_image_tag     = "first-prod"
enable_backend_lambda = true
```

Then:

```bash
cd infra/terraform/envs/prod
terraform plan
terraform apply
```

## 8. Deploy Static Frontend

From project root:

```bash
./scripts/deploy-frontend-static.sh
```

