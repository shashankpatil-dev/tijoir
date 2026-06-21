variable "aws_region" {
  description = "AWS region for production resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "tijoir"
}

variable "environment" {
  description = "Environment name. This Terraform stack is intended for production only."
  type        = string
  default     = "prod"

  validation {
    condition     = var.environment == "prod"
    error_message = "This Terraform stack is production-only. Use local Docker for local/staging."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the production VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "backend_image_tag" {
  description = "Backend image tag in ECR. Use a pushed tag such as git SHA. The repository is created by Terraform."
  type        = string
  default     = "bootstrap"
}

variable "enable_backend_lambda" {
  description = "Create the backend Lambda after a container image has been pushed to ECR."
  type        = bool
  default     = false
}

variable "lambda_memory_size" {
  description = "Lambda memory in MB."
  type        = number
  default     = 1536
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 60
}

variable "database_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "tijoir"
}

variable "database_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "tijoir_admin"
}

variable "database_instance_class" {
  description = "Smallest practical production-style RDS instance. RDS is managed, not EC2."
  type        = string
  default     = "db.t4g.micro"
}

variable "database_allocated_storage" {
  description = "RDS storage in GB."
  type        = number
  default     = 20
}

variable "database_backup_retention_period" {
  description = "RDS automated backup retention in days. Use 0 for free-tier-restricted accounts."
  type        = number
  default     = 0
}

variable "database_deletion_protection" {
  description = "Protect production DB from accidental deletion."
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "ElastiCache node type for share-link consume locks."
  type        = string
  default     = "cache.t4g.micro"
}

variable "allowed_cors_origins" {
  description = "Allowed origins for backend application CORS responses."
  type        = list(string)
  default     = ["*"]
}

variable "enable_secrets_manager_vpc_endpoint" {
  description = "Enable private VPC endpoint for Secrets Manager. Costs extra but avoids NAT."
  type        = bool
  default     = true
}
