variable "aws_region" {
  description = "AWS region where Terraform state resources will be created."
  type        = string
  default     = "ap-south-1"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform remote state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
  default     = "tijoir-terraform-locks"
}

variable "create_github_actions_role" {
  description = "Create an IAM role that GitHub Actions can assume through OIDC."
  type        = bool
  default     = false
}

variable "github_repository" {
  description = "GitHub repository in owner/repo format. Required when create_github_actions_role is true."
  type        = string
  default     = ""

  validation {
    condition     = var.github_repository == "" || can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must be in owner/repo format, for example shashankpatil-dev/tijoir."
  }
}

variable "github_actions_role_name" {
  description = "IAM role name for GitHub Actions Terraform automation."
  type        = string
  default     = "tijoir-github-actions-terraform"
}
