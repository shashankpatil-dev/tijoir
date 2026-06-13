# Cost Notes

The Terraform stack is designed to avoid EC2 application servers.

Lower-cost choices:

- Lambda container for backend instead of EC2.
- S3 + CloudFront for frontend instead of a frontend server.
- DynamoDB `PAY_PER_REQUEST` for locks, rate limits, and temporary security state instead of managed Redis.
- ECR lifecycle policy keeps only the latest 10 backend images.
- CloudWatch log retention is 14 days.

Main unavoidable cost:

- PostgreSQL is provisioned with RDS `db.t4g.micro` by default because the application needs relational metadata. Aurora Serverless v2 is more "serverless", but usually not cheaper for a small always-on portfolio project.

Optional cost:

- Secrets Manager VPC endpoint is enabled by default so Lambda can privately access Secrets Manager without NAT. It costs money hourly. NAT Gateway usually costs more.

For the cheapest experimentation, keep production destroyed when not in use and develop locally with Docker Compose.

