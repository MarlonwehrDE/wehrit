#!/usr/bin/env bash
set -euo pipefail

SITE_NAME="wehrit"
REMOTE_USER="deploy"
REMOTE_HOST="DEINE-VPS-IP-ODER-DOMAIN"
REMOTE_PATH="/srv/websites/${SITE_NAME}/dist/"

echo "Baue Website..."
npm run build

echo "Uebertrage nach ${REMOTE_HOST}..."
rsync -avz --delete dist/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "Fertig."
