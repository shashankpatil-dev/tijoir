# Secret Reveal Safety

Rules:

- Reveal secrets only through `POST`.
- Use `Cache-Control: no-store`.
- Do not log request or response bodies on reveal endpoints.
- Do not expose secret payloads in URLs or query parameters.
- Enforce one-time reveal with Redis locks where needed.

