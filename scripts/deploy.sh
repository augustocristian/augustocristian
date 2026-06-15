#!/usr/bin/env bash
# Build the static site into dist/ with Astro, optionally serving it locally
# at http://localhost:8080.
# Usage: ./scripts/deploy.sh [--serve]
set -euo pipefail

SERVE=false
for arg in "$@"; do
  case "$arg" in
    --serve) SERVE=true ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  npm install
fi

npm run build

if [ "$SERVE" = true ]; then
  npm run preview -- --port 8080
fi
