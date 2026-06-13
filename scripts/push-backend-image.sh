#!/usr/bin/env sh
set -eu

if [ "$#" -lt 2 ]; then
  echo "Usage: ./scripts/push-backend-image.sh <aws-region> <image-tag>"
  exit 1
fi

AWS_REGION="$1"
IMAGE_TAG="$2"
REPO_URL="$(cd infra/terraform/envs/prod && terraform output -raw backend_ecr_repository_url)"
REGISTRY_HOST="$(printf "%s" "$REPO_URL" | cut -d/ -f1)"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY_HOST"

docker build -f backend/Dockerfile.lambda -t "$REPO_URL:$IMAGE_TAG" backend
docker push "$REPO_URL:$IMAGE_TAG"

echo "Pushed $REPO_URL:$IMAGE_TAG"

