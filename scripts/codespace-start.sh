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

mkdir -p server/data-1.21.60 server/plugins-1.21.60
sudo chown -R 1000:1000 server/data-1.21.60 server/plugins-1.21.60
if [ -f server/data-1.21.60/server.properties ]; then
  python3 - <<'PY'
import re
p = "server/data-1.21.60/server.properties"
s = open(p).read()
s = re.sub(r"^xbox-auth=.*$", "xbox-auth=off", s, flags=re.M)
if "xbox-auth=" not in s:
    s += "\nxbox-auth=off\n"
open(p, "w").write(s)
PY
fi
sudo docker compose up -d pocketmine
sudo docker compose ps

PLAYIT_VERSION="v2.0.2"
PLAYIT_BIN_DIR="${HOME}/.local/bin"
PLAYIT_CONFIG_DIR="${HOME}/.config/playit"
PLAYIT_SOCKET="${PLAYIT_CONFIG_DIR}/playit.sock"
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
else
  if ! pgrep -f "playitd --socket-path=${PLAYIT_SOCKET}" >/dev/null 2>&1; then
    setsid nohup "$PLAYIT_BIN_DIR/playitd" --socket-path="$PLAYIT_SOCKET" --secret-path="$PLAYIT_SECRET" >/tmp/playitd-rustage.log 2>&1 </dev/null &
    sleep 2
  fi
  "$PLAYIT_BIN_DIR/playit" --socket-path="$PLAYIT_SOCKET" status || true
fi

tailscale ip -4
