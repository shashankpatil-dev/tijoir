# Architecture Notes

Tijoir is planned as a Spring Boot modular monolith.

Core services:

- PostgreSQL for metadata
- Redis for locks and rate limits
- AWS Secrets Manager for production secret payloads

Additional notes:

- [aws-production.md](aws-production.md)
- [global-identity-and-vendor-sharing.md](global-identity-and-vendor-sharing.md)
- [performance-and-cache-roadmap.md](performance-and-cache-roadmap.md)
- [redis-auth-notifications-workplan.md](redis-auth-notifications-workplan.md)
