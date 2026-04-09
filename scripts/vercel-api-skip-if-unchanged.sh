#!/usr/bin/env sh
# Ignored Build Step (proyecto API en Vercel): código 0 = omitir build, 1 = ejecutar build.
# Vercel → proyecto API → Settings → Git → Ignored Build Step (elegir según Root Directory):
#   Root "." (repo):     bash scripts/vercel-api-skip-if-unchanged.sh
#   Root "packages/api": bash ../../scripts/vercel-api-skip-if-unchanged.sh

set -eu

if ! ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  exit 1
fi
cd "$ROOT"

# Sin commit anterior (primer deploy, etc.): siempre buildear.
if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  exit 1
fi

# Solo estos paths alimentan el deploy de la API (vercel:build + workspace).
git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA}" "${VERCEL_GIT_COMMIT_SHA:-HEAD}" -- \
  packages/api \
  packages/database \
  packages/contracts \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  package.json \
  turbo.json
