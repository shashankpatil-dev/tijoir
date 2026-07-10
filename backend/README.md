# Tijoir Backend

Spring Boot modular monolith for secure vendor credential exchange.

## Modules

```text
auth          registration, login, JWT, email verification
organization  organizations, users, roles
secret        secret metadata and generator
sharelink     one-time public share links
connection    organization-to-organization connections and offboarding
contract      integration contracts and contract secret permissions
notification  lightweight notification records
audit         append-only audit logs
rotation      secret version rotation history
common        config, exceptions, security controls, AWS, and shared utilities
```

## Local Dependencies

```text
PostgreSQL
AWS credentials for the deferred production secret-storage path
```
