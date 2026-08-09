#!/bin/bash
# Deploy script for caveshuttle web app
# Builds the app and uploads it to the server via SSH

set -e  # Exit on error

# Load deployment configuration from .env
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Missing $SCRIPT_DIR/.env. Copy .env.example to .env and fill in your values."
  exit 1
fi

set -a
source "$SCRIPT_DIR/.env"
set +a

echo "Building caveshuttle web app..."
npm run build

# By default, skip tiles/char*.bmp (they rarely change and some filenames
# contain non-ASCII characters that confuse rsync/ssh). Use --include-tiles
# to force-sync them.
RSYNC_TILES_EXCLUDE='--exclude=tiles/char*.bmp'
if [ "$1" = "--include-tiles" ]; then
  RSYNC_TILES_EXCLUDE=''
  echo "Including tiles/char*.bmp in sync..."
fi

echo "Uploading web app to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}..."
rsync -avz --progress --delete --checksum \
  --exclude=node_modules \
  --exclude=server \
  --exclude=package.json \
  --exclude=package-lock.json \
  $RSYNC_TILES_EXCLUDE dist/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}

echo "Uploading server files..."
rsync -avz --exclude=node_modules server/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/server/
rsync -avz package.json package-lock.json ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "Installing server dependencies on ${REMOTE_HOST}..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && npm install --production 2>&1"

echo "Setting owner to ${REMOTE_CHOWN_USER}:${REMOTE_CHOWN_GROUP} on ${REMOTE_HOST}..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "chown -R ${REMOTE_CHOWN_USER}:${REMOTE_CHOWN_GROUP} ${REMOTE_PATH}"

echo "Restarting Geckos server on ${REMOTE_HOST}..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_PATH} && pm2 restart caveshuttle-geckos 2>/dev/null || pm2 start server/index.js --name caveshuttle-geckos 2>&1"

echo "Deploy complete!"
