#!/usr/bin/env bash
set -euo pipefail

command -v docker >/dev/null || { printf 'Docker missing\n' >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { printf 'Docker Compose missing\n' >&2; exit 1; }

mkdir -p server/data server/plugins
if [ "$(id -u)" -eq 0 ]; then
  chown -R 1000:1000 server/data server/plugins
fi

docker compose up -d pocketmine
docker compose ps
