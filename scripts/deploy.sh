#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
[ -f .env ] && source .env
set +a

: "${DEPLOY_HOST:?Missing DEPLOY_HOST in .env}"
: "${DEPLOY_USER:?Missing DEPLOY_USER in .env}"
: "${DEPLOY_PATH:?Missing DEPLOY_PATH in .env}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
TARGET="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH%/}/"

echo "Deploying dist/ to ${TARGET}"

rsync -az --delete \
  -e "ssh -p ${DEPLOY_PORT}" \
  dist/ \
  "$TARGET"

echo "Deployment completed successfully."

