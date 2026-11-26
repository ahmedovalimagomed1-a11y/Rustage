#!/usr/bin/env bash
set -euo pipefail

if ! command -v tailscale >/dev/null 2>&1; then
  curl -fsSL https://tailscale.com/install.sh | sh
fi

if ! tailscale status --self >/dev/null 2>&1; then
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

mkdir -p server/data server/plugins
sudo chown -R 1000:1000 server/data server/plugins
sudo docker compose up -d pocketmine
sudo docker compose ps
tailscale ip -4
