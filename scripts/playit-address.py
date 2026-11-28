#!/usr/bin/env python3
import json
import os
import sys
import urllib.request
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:
    tomllib = None

CONFIG = Path(os.environ.get("PLAYIT_CONFIG", Path.home() / ".config" / "playit" / "playit.toml"))
API = "https://api.playit.gg/agents/rundata"


def read_secret():
    if not CONFIG.exists():
        return None
    text = CONFIG.read_text(encoding="utf-8")
    if tomllib:
        return tomllib.loads(text).get("secret_key")
    for line in text.splitlines():
        if line.strip().startswith("secret_key"):
            return line.split("=", 1)[1].strip().strip('"')
    return None


def main():
    secret = read_secret()
    if not secret:
        print("playit: secret not found", file=sys.stderr)
        return 0
    request = urllib.request.Request(
        API,
        data=b"{}",
        headers={"Authorization": f"agent-key {secret}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        print(f"playit: address lookup failed: {error}", file=sys.stderr)
        return 0

    tunnels = (payload.get("data") or {}).get("tunnels") or []
    found = 0
    for tunnel in tunnels:
        if tunnel.get("local_port") != 19132:
            continue
        domain = tunnel.get("assigned_domain") or tunnel.get("custom_domain")
        port = (tunnel.get("port") or {}).get("from")
        if not domain or not port:
            continue
        proto = tunnel.get("proto") or "udp"
        print(f"Bedrock {proto.upper()}: {domain}:{port}")
        found += 1
    if not found:
        print("playit: no Bedrock tunnel found", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
