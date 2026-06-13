# Google Cloud Notes

Tijoir uses Google Cloud Secret Manager for secret payload storage.

## Required Later

```text
GCP project id
Secret Manager API enabled
service account with secretmanager.secretAccessor and secretmanager.secretVersionManager permissions
GOOGLE_APPLICATION_CREDENTIALS pointing to the service account JSON
```

## MVP Local Strategy

Start with an interface around secret storage so tests can use an in-memory implementation and local development can switch to Google Cloud Secret Manager when credentials are configured.

