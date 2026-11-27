#!/usr/bin/env python3
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "server" / "waterdog"
SECRET_PATH = Path(os.environ.get("PLAYIT_SECRET", os.path.expanduser("~/.config/playit/playit.toml")))
API_BASE = "https://api.playit.gg"
ENDPOINT = "https://nethernet.playit.gg"


def read_secret():
    if not SECRET_PATH.is_file():
        raise RuntimeError("playit secret file missing")
    text = SECRET_PATH.read_text(encoding="utf-8", errors="ignore")
    match = re.search(r"^secret_key\s*=\s*[\"']?([^\"'\r\n]+)", text, re.M)
    if not match:
        raise RuntimeError("secret_key missing in playit config")
    secret = match.group(1).strip()
    if not secret:
        raise RuntimeError("secret_key empty")
    return secret


def api(secret, path, payload):
    request = urllib.request.Request(
        f"{API_BASE}/{path.lstrip('/')}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"agent-key {secret}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="ignore").strip()
        raise RuntimeError(f"{path} failed: HTTP {error.code}: {body[:160]}") from error


def as_dict(value):
    return value if isinstance(value, dict) else {}


def tunnel_entries(value):
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if isinstance(value, dict):
        for key in ("tunnels", "data", "items"):
            nested = value.get(key)
            if isinstance(nested, list):
                return [item for item in nested if isinstance(item, dict)]
            if isinstance(nested, dict):
                return tunnel_entries(nested)
        return [value]
    return []


def select_tunnel(tunnels):
    with_token = []
    for tunnel in tunnels:
        token = str(tunnel.get("nethernet_token") or "").strip()
        if token:
            with_token.append((tunnel, token))
    for tunnel, token in with_token:
        kind = str(tunnel.get("tunnel_type") or tunnel.get("type") or "").lower()
        name = str(tunnel.get("name") or "").lower()
        if "nethernet" in kind or "nethernet" in name:
            return tunnel, token
    if len(with_token) == 1:
        return with_token[0]
    raise RuntimeError("no NetherNet tunnel with nethernet_token found")


def tunnel_local_port(tunnel):
    origin = as_dict(tunnel.get("origin"))
    candidates = [as_dict(origin.get("data")).get("local_port")]
    details = as_dict(origin.get("details"))
    config_data = as_dict(details.get("config_data"))
    for field in config_data.get("fields") or []:
        if isinstance(field, dict) and field.get("name") == "local_port":
            candidates.append(field.get("value"))
    for candidate in candidates:
        try:
            port = int(candidate)
        except (TypeError, ValueError):
            continue
        if 1 <= port <= 65535:
            return port
    raise RuntimeError("tunnel local_port missing or invalid")


def tunnel_advertise_address(tunnel):
    alloc_data = as_dict(as_dict(tunnel.get("alloc")).get("data"))
    ip = str(alloc_data.get("static_ip4") or "").strip()
    port = alloc_data.get("port_start")
    if not ip or port is None:
        raise RuntimeError("tunnel public IPv4 allocation missing")
    try:
        public_port = int(port)
    except (TypeError, ValueError) as error:
        raise RuntimeError("tunnel public port invalid") from error
    if not 1 <= public_port <= 65535:
        raise RuntimeError("tunnel public port invalid")
    return f"{ip}:{public_port}"


def render_config(token_file, local_port, advertise_address):
    return f"""listener:
  motd: "§bRustage§3PE"
  sub_motd: "Rust survival"
  name: "Rustage"
  priorities:
    - rustage
  host: 0.0.0.0:{local_port}
  transport: nethernet
  max_players: 20
  forced_hosts: {{}}
  additional_ports: []
  join_handler: DefaultJoinHandler
  reconnect_handler: DefaultReconnectHandler
servers:
  rustage:
    address: 127.0.0.1:19142
    public_address: 127.0.0.1:19142
    server_type: nethernet
network_settings:
  enable_ipv6: false
  max_user_mtu: 1400
  max_downstream_mtu: 1400
  connection_timeout: 15
  connection_throttle_time: 1000
  connection_throttle: 5
  login_throttle: 2
  enable_cookies: true
  proxy_protocol_whitelisted_ips: []
  error_timeout: 15
  login_timeout: 10
  random_downstream_loopback_address: false
nethernet:
  webrtc_port: {local_port}
  signaling:
    mode: nxs
    advertise_addresses:
      - {advertise_address}
    stun_discovery: false
    trusted_proxies: []
    nxs:
      token: file:{token_file}
      endpoint: {ENDPOINT}
      advanced:
        assisted_joins: true
        connection_checks: true
        location: {{}}
        deregister_on_shutdown: false
  identity_file: keys/identity.pem
permissions: {{}}
permissions_default: []
enable_debug: false
enable_query: true
online_mode: false
upstream_encryption: true
use_login_extras: false
enable_edu_features: false
replace_username_spaces: false
prefer_fast_transfer: true
inject_proxy_commands: true
compression: zlib
upstream_compression_level: 6
downstream_compression_level: 2
enable_packs: true
overwrite_client_packs: false
force_server_packs: false
pack_cache_size: 16
pack_cdn_urls: []
disable_cdn_for: []
force_disable_vibrant_visuals: false
default_idle_threads: -1
enable_statistics: true
enable_error_reporting: true
config_version: 3
"""


def main():
    secret = read_secret()
    run_data = as_dict(api(secret, "agents/rundata", {}))
    run_payload = as_dict(run_data.get("data", run_data))
    agent_id = str(run_payload.get("agent_id") or "").strip()
    if not agent_id:
        raise RuntimeError("agent_id missing in agents/rundata response")
    tunnels = tunnel_entries(api(secret, "tunnels/list", {"agent_id": agent_id}))
    if not tunnels:
        tunnels = tunnel_entries(run_payload.get("tunnels"))
    tunnel, token = select_tunnel(tunnels)
    local_port = tunnel_local_port(tunnel)
    advertise_address = tunnel_advertise_address(tunnel)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    token_path = OUT_DIR / "nethernet-token.txt"
    config_path = OUT_DIR / "config.yml"
    token_path.write_text(token.strip() + "\n", encoding="utf-8")
    token_path.chmod(0o600)
    config_path.write_text(render_config("/app/nethernet-token.txt", local_port, advertise_address), encoding="utf-8")
    config_path.chmod(0o600)

    tunnel_id = str(tunnel.get("id") or "")
    alloc_data = as_dict(as_dict(tunnel.get("alloc")).get("data"))
    domain = str(alloc_data.get("assigned_domain") or tunnel.get("assigned_domain") or "")
    print(f"configured WaterdogPE from tunnel {tunnel_id} {domain} local_port={local_port} advertise={advertise_address}".strip())


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"configure-waterdog: {error}", file=sys.stderr)
        sys.exit(1)
