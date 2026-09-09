#!/bin/sh
# Runs indexer + appview server in one machine/volume so they share the
# same sqlite file (Fly volumes are single-machine — see fly.toml).
set -e

if [ "$INDEXER_ENABLED" = "true" ]; then
  node scripts/indexer.js &
fi

exec node src/index.js
