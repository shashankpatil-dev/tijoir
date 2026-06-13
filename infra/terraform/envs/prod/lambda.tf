resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Backend Lambda security group"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/lambda/${local.name_prefix}-backend"
  retention_in_days = 14
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "backend_lambda" {
  name               = "${local.name_prefix}-backend-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.backend_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.backend_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "backend_app" {
  statement {
    sid = "ReadDatabaseSecret"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [
      aws_secretsmanager_secret.database.arn,
      "${aws_secretsmanager_secret.app_secret_prefix.arn}*"
    ]
  }

  statement {
    sid = "CreateAppSecrets"
    actions = [
      "secretsmanager:CreateSecret"
    ]
    resources = ["*"]

    condition {
      test     = "StringLike"
      variable = "secretsmanager:Name"
      values   = ["${local.name_prefix}/app/*"]
    }
  }

  statement {
    sid = "ManageAppSecrets"
    actions = [
      "secretsmanager:DescribeSecret",
      "secretsmanager:GetSecretValue",
      "secretsmanager:PutSecretValue",
      "secretsmanager:UpdateSecret",
      "secretsmanager:TagResource"
    ]
    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}/app/*"
    ]
  }

  statement {
    sid = "UseAppKmsKey"
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]
    resources = [aws_kms_key.app.arn]
  }

  statement {
    sid = "UseSecurityControlTable"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query"
    ]
    resources = [aws_dynamodb_table.security_control.arn]
  }
}

resource "aws_iam_policy" "backend_app" {
  name   = "${local.name_prefix}-backend-app-policy"
  policy = data.aws_iam_policy_document.backend_app.json
}

resource "aws_iam_role_policy_attachment" "backend_app" {
  role       = aws_iam_role.backend_lambda.name
  policy_arn = aws_iam_policy.backend_app.arn
}

resource "aws_lambda_function" "backend" {
  count = var.enable_backend_lambda ? 1 : 0

  function_name = "${local.name_prefix}-backend"
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
  role          = aws_iam_role.backend_lambda.arn

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      SPRING_PROFILES_ACTIVE        = "prod"
      DATABASE_SECRET_ARN          = aws_secretsmanager_secret.database.arn
      SECURITY_CONTROL_TABLE_NAME  = aws_dynamodb_table.security_control.name
      APP_SECRET_NAME_PREFIX       = "${local.name_prefix}/app/"
      APP_SECRETS_PLACEHOLDER_ARN  = aws_secretsmanager_secret.app_secret_prefix.arn
      AWS_KMS_KEY_ID               = aws_kms_key.app.arn
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.backend,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_iam_role_policy_attachment.backend_app
  ]
}

resource "aws_lambda_function_url" "backend" {
  count = var.enable_backend_lambda ? 1 : 0

  function_name      = aws_lambda_function.backend[0].function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_headers     = ["authorization", "content-type", "x-request-id"]
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins     = var.allowed_cors_origins
    max_age           = 300
  }
}
