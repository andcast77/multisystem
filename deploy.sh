#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull origin v2

docker compose up -d --build api hub
docker compose up -d
