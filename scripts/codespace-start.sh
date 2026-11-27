#!/usr/bin/env bash
set -euo pipefail

if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

if ! tailscale status --self >/dev/null 2>&1; then
  if ! sudo test -S /var/run/tailscale/tailscaled.sock; then
    sudo mkdir -p /var/lib/tailscale /var/run/tailscale
    sudo rm -f /var/run/tailscale/tailscaled.sock
    sudo setsid nohup tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock >/tmp/tailscaled-rustage.log 2>&1 </dev/null &
    sleep 3
  fi
  if [ -z "${TS_AUTHKEY:-}" ]; then
    printf 'TS_AUTHKEY missing\n' >&2
    exit 1
  fi
  sudo tailscale up --auth-key="$TS_AUTHKEY" --hostname=rustage
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

mkdir -p server/bds-data server/waterdog
sudo chown -R 1000:1000 server/bds-data server/waterdog

bash scripts/install-addon.sh
sudo chown -R 1000:1000 server/bds-data

if [ ! -f server/waterdog/Waterdog.jar ]; then
  curl -fsSL https://github.com/WaterdogPE/WaterdogPE/releases/download/latest/Waterdog.jar -o server/waterdog/Waterdog.jar
fi

PLAYIT_VERSION="v2.0.2"
PLAYIT_BIN_DIR="${HOME}/.local/bin"
PLAYIT_CONFIG_DIR="${HOME}/.config/playit"
PLAYIT_SOCKET="/run/playit/playitd.sock"
PLAYIT_SECRET="${PLAYIT_CONFIG_DIR}/playit.toml"

mkdir -p "$PLAYIT_BIN_DIR" "$PLAYIT_CONFIG_DIR"

if [ ! -x "$PLAYIT_BIN_DIR/playit" ]; then
  curl -fsSL "https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_VERSION}/playit-cli-linux-amd64" -o "$PLAYIT_BIN_DIR/playit"
  chmod +x "$PLAYIT_BIN_DIR/playit"
fi

if [ ! -x "$PLAYIT_BIN_DIR/playitd" ]; then
  curl -fsSL "https://github.com/playit-cloud/playit-agent/releases/download/${PLAYIT_VERSION}/playit-linux-amd64" -o "$PLAYIT_BIN_DIR/playitd"
  chmod +x "$PLAYIT_BIN_DIR/playitd"
fi

if [ ! -f "$PLAYIT_SECRET" ]; then
  printf 'playit secret missing; claim not completed\n' >&2
  exit 1
fi

if [ ! -S "$PLAYIT_SOCKET" ] || ! "$PLAYIT_BIN_DIR/playit" status >/dev/null 2>&1; then
  setsid nohup "$PLAYIT_BIN_DIR/playitd" --secret-path="$PLAYIT_SECRET" >/tmp/playitd-rustage.log 2>&1 </dev/null &
  sleep 3
fi

"$PLAYIT_BIN_DIR/playit" status || true

python3 scripts/configure-waterdog.py

sudo docker compose pull bds waterdog
sudo docker rm -f rustage-pocketmine >/dev/null 2>&1 || true
sudo docker compose up -d bds
sleep 10
sudo docker compose up -d --force-recreate --no-deps waterdog
sudo docker compose ps

tailscale ip -4
