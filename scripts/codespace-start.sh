#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

bash scripts/fetch-bds-1.21.50.sh
bash scripts/install-addon.sh

PLAYIT_VERSION="v2.0.2"
PLAYIT_BIN_DIR="${HOME}/.local/bin"
PLAYIT_CONFIG_DIR="${HOME}/.config/playit"
PLAYIT_SOCKET="/run/playit/playitd.sock"
PLAYIT_SECRET="${PLAYIT_CONFIG_DIR}/playit.toml"

mkdir -p "$PLAYIT_BIN_DIR" "$PLAYIT_CONFIG_DIR"

if [[ ! -x "$PLAYIT_BIN_DIR/playit" ]]; then
  curl -fsSL "https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_VERSION}/playit-cli-linux-amd64" -o "$PLAYIT_BIN_DIR/playit"
  chmod +x "$PLAYIT_BIN_DIR/playit"
fi

if [[ ! -x "$PLAYIT_BIN_DIR/playitd" ]]; then
  curl -fsSL "https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_VERSION}/playit-linux-amd64" -o "$PLAYIT_BIN_DIR/playitd"
  chmod +x "$PLAYIT_BIN_DIR/playitd"
fi

if [[ ! -f "$PLAYIT_SECRET" ]]; then
  echo "playit secret missing; claim not completed" >&2
  exit 1
fi

if [[ ! -S "$PLAYIT_SOCKET" ]] || ! "$PLAYIT_BIN_DIR/playit" status >/dev/null 2>&1; then
  setsid nohup "$PLAYIT_BIN_DIR/playitd" --secret-path="$PLAYIT_SECRET" >/tmp/playitd-rustage.log 2>&1 </dev/null &
  sleep 3
fi

"$PLAYIT_BIN_DIR/playit" status || true
python3 "$ROOT/scripts/playit-address.py" || true
docker compose -f "$ROOT/docker-compose.yml" up -d --force-recreate bds
sleep 10
docker compose -f "$ROOT/docker-compose.yml" ps
