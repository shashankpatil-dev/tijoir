# Scripts

Developer scripts will live here.

Planned scripts:

- local service startup checks
- API smoke demo
- test helpers
- production backend image push
- production static frontend deploy

`deploy-frontend-static.sh` builds the Next.js static site with the production
backend Function URL from Terraform output, syncs `frontend/out` to the
frontend S3 bucket, and invalidates the CloudFront distribution.
