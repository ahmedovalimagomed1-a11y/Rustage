#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BDS="$ROOT/server/bds-1.21.50"
DATA="$ROOT/server/bds-data"
IMAGE="lomot/minecraft-bedrock:1.21.50.10"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [[ ! -x "$BDS/bedrock_server" ]]; then
  docker pull "$IMAGE"
  container="$(docker create "$IMAGE")"
  trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
  rm -rf "$BDS"
  mkdir -p "$BDS"
  docker cp "$container:/mcpe/server/." "$BDS/"
  docker rm -f "$container" >/dev/null 2>&1 || true
  trap - EXIT
  chmod +x "$BDS/bedrock_server"
  echo "extracted BDS 1.21.50.10 to $BDS"
fi

mkdir -p "$DATA/worlds"
if [[ ! -f "$DATA/server.properties" ]]; then
  docker run --rm --entrypoint cat "$IMAGE" /mcpe/default-config/server.properties > "$DATA/server.properties"
fi
if [[ ! -f "$DATA/permissions.json" ]]; then
  docker run --rm --entrypoint cat "$IMAGE" /mcpe/default-config/permissions.json > "$DATA/permissions.json"
fi
if [[ ! -f "$DATA/allowlist.json" ]]; then
  docker run --rm --entrypoint cat "$IMAGE" /mcpe/default-config/allowlist.json > "$DATA/allowlist.json"
fi

if [[ $(id -u) -eq 0 ]]; then
  chown -R 1000:1000 "$BDS" "$DATA"
fi

echo "BDS ready: $BDS"
