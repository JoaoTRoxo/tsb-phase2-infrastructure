#!/usr/bin/env bash
# Create a .env with strong random secrets for docker compose.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -e .env ]; then
  echo ".env already exists. Changing its secrets would lock out the existing data, so it was left alone."
  exit 1
fi

secret() { head -c 24 /dev/urandom | base64 | tr -d '\n'; }
umask 077
cat > .env <<ENV
POSTGRES_PASSWORD=$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9')
APP_KEYS=$(secret),$(secret),$(secret),$(secret)
API_TOKEN_SALT=$(secret)
ADMIN_JWT_SECRET=$(secret)
TRANSFER_TOKEN_SALT=$(secret)
JWT_SECRET=$(secret)
ENCRYPTION_KEY=$(secret)

# Publishing rebuilds the site when these are set.
GITHUB_DISPATCH_REPO=
GITHUB_DISPATCH_TOKEN=
REBUILD_DEBOUNCE_SECONDS=60
ENV
echo "Created .env with new secrets."
