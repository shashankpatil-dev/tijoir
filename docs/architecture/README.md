# Architecture Notes

Tijoir is planned as a Spring Boot modular monolith.

Core services:

- PostgreSQL for metadata
- Redis for locks and rate limits
- AWS Secrets Manager for production secret payloads

Additional notes:

- [aws-production.md](aws-production.md)
- [performance-and-cache-roadmap.md](performance-and-cache-roadmap.md)
