resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-database-sg"
  description = "Allow PostgreSQL from backend Lambda"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-postgres"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "postgres" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.database_instance_class

  db_name  = var.database_name
  username = var.database_username
  password = random_password.database.result

  allocated_storage     = var.database_allocated_storage
  max_allocated_storage = 100
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.app.arn

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false

  backup_retention_period   = 7
  deletion_protection       = var.database_deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final-snapshot"

  performance_insights_enabled = false
  auto_minor_version_upgrade   = true
}
