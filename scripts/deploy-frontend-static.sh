#!/usr/bin/env sh
set -eu

BUCKET_NAME="$(cd infra/terraform/envs/prod && terraform output -raw frontend_bucket_name)"
BACKEND_URL="${NEXT_PUBLIC_API_BASE_URL:-$(cd infra/terraform/envs/prod && terraform output -raw backend_function_url 2>/dev/null || true)}"

cd frontend
if [ -n "$BACKEND_URL" ] && [ "$BACKEND_URL" != "null" ]; then
  export NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL"
fi
npm run build
cd ..

aws s3 sync frontend/out "s3://$BUCKET_NAME" --delete

echo "Synced frontend/out to s3://$BUCKET_NAME"
