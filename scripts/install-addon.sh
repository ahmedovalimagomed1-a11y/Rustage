#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BDS="$ROOT/server/bds-1.21.50"
DATA="$ROOT/server/bds-data"
WORLD="$DATA/worlds/Rustage"

bash "$ROOT/scripts/fetch-bds-1.21.50.sh"
python3 "$ROOT/scripts/generate-rustage-assets.py"

mkdir -p "$BDS/behavior_packs" "$BDS/resource_packs" "$WORLD"
rm -rf "$BDS/behavior_packs/RustageBP" "$BDS/resource_packs/RustageRP"
mkdir -p "$BDS/behavior_packs/RustageBP" "$BDS/resource_packs/RustageRP"
cp -a "$ROOT/addon/bp/." "$BDS/behavior_packs/RustageBP/"
cp -a "$ROOT/addon/rp/." "$BDS/resource_packs/RustageRP/"

cat > "$BDS/valid_known_packs.json" <<'JSON'
[{"file_version":2},{"file_system":"RawPath","path":"behavior_packs/RustageBP","uuid":"8c29fe7b-377b-4fc4-bbf2-89f387508255","version":"1.0.0"},{"file_system":"RawPath","path":"resource_packs/RustageRP","uuid":"3d03bc29-2ab9-49d7-8bf3-2eb969c22291","version":"1.0.0"}]
JSON

cat > "$WORLD/world_behavior_packs.json" <<'JSON'
[{"pack_id":"8c29fe7b-377b-4fc4-bbf2-89f387508255","version":[1,0,0]}]
JSON

cat > "$WORLD/world_resource_packs.json" <<'JSON'
[{"pack_id":"3d03bc29-2ab9-49d7-8bf3-2eb969c22291","version":[1,0,0]}]
JSON

python3 - "$DATA/server.properties" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
wanted = {
    "server-name": "Rustage",
    "gamemode": "survival",
    "force-gamemode": "true",
    "difficulty": "normal",
    "allow-cheats": "true",
    "max-players": "20",
    "online-mode": "false",
    "allow-list": "false",
    "server-port": "19132",
    "server-portv6": "19133",
    "enable-lan-visibility": "false",
    "view-distance": "16",
    "tick-distance": "4",
    "player-idle-timeout": "30",
    "level-name": "Rustage",
    "default-player-permission-level": "member",
    "texturepack-required": "true",
    "disable-player-interaction": "false",
}
lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
seen = set()
out = []
for line in lines:
    key = line.split("=", 1)[0].strip()
    if key in wanted:
        out.append(f"{key}={wanted[key]}")
        seen.add(key)
    else:
        out.append(line)
for key, value in wanted.items():
    if key not in seen:
        out.append(f"{key}={value}")
path.write_text("\n".join(out) + "\n", encoding="utf-8")
PY

chmod -R a+rX "$BDS/behavior_packs/RustageBP" "$BDS/resource_packs/RustageRP" "$WORLD" "$BDS/valid_known_packs.json" "$DATA/server.properties"

if [[ "${1:-}" == "--restart" ]]; then
  cd "$ROOT"
  docker compose -f "$ROOT/docker-compose.yml" up -d --force-recreate bds
  for _ in $(seq 1 60); do
    if docker logs rustage-bds 2>&1 | grep -q "Server started"; then
      break
    fi
    sleep 1
  done
  docker logs rustage-bds 2>&1 | tail -30
  if ! docker logs rustage-bds 2>&1 | grep -q "Server started"; then
    echo "BDS did not report Server started" >&2
    exit 1
  fi
  if command -v playit >/dev/null 2>&1; then
    playit status 2>&1 | grep -E "Phase:|PID:|Secret configured:" || true
  fi
  docker compose -f "$ROOT/docker-compose.yml" ps
fi
