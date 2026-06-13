# AWS Production Architecture

Tijoir production uses AWS infrastructure managed through Terraform.

```text
Users
  -> CloudFront
  -> S3 static frontend
  -> Lambda Function URL
  -> Lambda backend container
  -> RDS PostgreSQL
  -> AWS Secrets Manager
  -> DynamoDB security-control table
```

## Notes

- Local development still uses Docker Compose.
- Production secret payload storage uses AWS Secrets Manager.
- DynamoDB replaces Redis in production for low-cost locks, rate limits, and temporary security state.
- RDS PostgreSQL remains the source of truth for relational metadata.

