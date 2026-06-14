#!/usr/bin/env sh
set -eu

BUCKET_NAME="$(cd infra/terraform/envs/prod && terraform output -raw frontend_bucket_name)"
CF_DISTRIBUTION_ID="$(cd infra/terraform/envs/prod && terraform output -raw frontend_cloudfront_distribution_id)"
BACKEND_URL="${NEXT_PUBLIC_API_BASE_URL:-$(cd infra/terraform/envs/prod && terraform output -raw backend_function_url 2>/dev/null || true)}"

cd frontend
if [ -n "$BACKEND_URL" ] && [ "$BACKEND_URL" != "null" ]; then
  export NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL"
fi
npm run build
cd ..

aws s3 sync frontend/out "s3://$BUCKET_NAME" --delete
cd frontend/out
find . -name '*.html' | while IFS= read -r file; do
  key="${file#./}"
  aws s3 cp "$file" "s3://$BUCKET_NAME/$key" \
    --cache-control 'no-cache, no-store, must-revalidate' \
    --content-type 'text/html; charset=utf-8'
done
cd ../..
aws cloudfront create-invalidation --distribution-id "$CF_DISTRIBUTION_ID" --paths '/*'

echo "Synced frontend/out to s3://$BUCKET_NAME and invalidated CloudFront $CF_DISTRIBUTION_ID"
