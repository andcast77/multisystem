#!/bin/sh
set -e
echo "Running database migrations..."
pnpm --filter @multisystem/database migrate:deploy
echo "Starting API..."
exec "$@"
