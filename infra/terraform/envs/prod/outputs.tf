output "backend_ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "backend_function_url" {
  value = var.enable_backend_lambda ? aws_lambda_function_url.backend[0].function_url : null
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "frontend_cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "database_secret_arn" {
  value     = aws_secretsmanager_secret.database.arn
  sensitive = true
}

output "security_control_table_name" {
  value = aws_dynamodb_table.security_control.name
}

output "kms_key_arn" {
  value = aws_kms_key.app.arn
}
