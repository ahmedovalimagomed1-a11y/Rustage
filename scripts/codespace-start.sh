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
tailscale ip -4
