resource "aws_kms_key" "app" {
  description             = "KMS key for Tijoir production secrets"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "app" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.app.key_id
}

resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "database" {
  name                    = "${local.name_prefix}/database"
  kms_key_id              = aws_kms_key.app.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id

  secret_string = jsonencode({
    username = var.database_username
    password = random_password.database.result
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.database_name
  })
}

resource "aws_secretsmanager_secret" "app_secret_prefix" {
  name                    = "${local.name_prefix}/managed-secrets-placeholder"
  kms_key_id              = aws_kms_key.app.arn
  recovery_window_in_days = 7
  description             = "Placeholder secret proving the app secret namespace exists."
}

