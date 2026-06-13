output "state_bucket_name" {
  value = aws_s3_bucket.state.bucket
}

output "lock_table_name" {
  value = aws_dynamodb_table.locks.name
}

output "backend_config" {
  value = <<EOT
bucket         = "${aws_s3_bucket.state.bucket}"
key            = "prod/terraform.tfstate"
region         = "${var.aws_region}"
dynamodb_table = "${aws_dynamodb_table.locks.name}"
encrypt        = true
EOT
}

output "github_actions_role_arn" {
  value = var.create_github_actions_role ? aws_iam_role.github_actions[0].arn : null
}
