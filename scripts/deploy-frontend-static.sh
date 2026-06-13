#!/usr/bin/env sh
set -eu

BUCKET_NAME="$(cd infra/terraform/envs/prod && terraform output -raw frontend_bucket_name)"

cd frontend
npm run build
cd ..

aws s3 sync frontend/out "s3://$BUCKET_NAME" --delete

echo "Synced frontend/out to s3://$BUCKET_NAME"

