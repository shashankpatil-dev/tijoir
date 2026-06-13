# Architecture Notes

Tijoir is planned as a Spring Boot modular monolith.

Core services:

- PostgreSQL for metadata
- Redis for locks and rate limits
- Google Cloud Secret Manager for secret payloads

