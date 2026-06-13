# Audit Design

Audit logs are append-only evidence for sensitive actions.

Rules:

- No update endpoint.
- No delete endpoint.
- Use server-side timestamps.
- Store actor, organization, action, resource, request id, IP address, and user agent.
- Never store raw secret payloads, raw share tokens, passwords, or passphrases.

