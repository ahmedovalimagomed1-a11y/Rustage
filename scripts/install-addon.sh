#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BDS="$ROOT/server/levilamina"
SUDO=()
if [[ $(id -u) -ne 0 || ! -w "$BDS" ]]; then
  SUDO=(sudo)
fi

python3 "$ROOT/scripts/generate-addon-images.py"
python3 "$ROOT/scripts/generate-addon-models.py"

"${SUDO[@]}" mkdir -p "$BDS/behavior_packs/RustageBP" "$BDS/resource_packs/RustageRP" "$BDS/worlds/Rustage"
"${SUDO[@]}" cp -a "$ROOT/addon/bp/." "$BDS/behavior_packs/RustageBP/"
"${SUDO[@]}" cp -a "$ROOT/addon/rp/." "$BDS/resource_packs/RustageRP/"
printf '%s\n' '[{"pack_id":"8c29fe7b-377b-4fc4-bbf2-89f387508255","version":[1,0,0]}]' | "${SUDO[@]}" tee "$BDS/worlds/Rustage/world_behavior_packs.json" >/dev/null
printf '%s\n' '[{"pack_id":"3d03bc29-2ab9-49d7-8bf3-2eb969c22291","version":[1,0,0]}]' | "${SUDO[@]}" tee "$BDS/worlds/Rustage/world_resource_packs.json" >/dev/null
printf '%s\n' '[{"file_version":2},{"file_system":"RawPath","path":"behavior_packs/RustageBP","uuid":"8c29fe7b-377b-4fc4-bbf2-89f387508255","version":"1.0.0"},{"file_system":"RawPath","path":"resource_packs/RustageRP","uuid":"3d03bc29-2ab9-49d7-8bf3-2eb969c22291","version":"1.0.0"}]' | "${SUDO[@]}" tee "$BDS/valid_known_packs.json" >/dev/null
"${SUDO[@]}" chmod -R a+rX "$BDS/behavior_packs/RustageBP" "$BDS/resource_packs/RustageRP" "$BDS/worlds/Rustage/world_behavior_packs.json" "$BDS/worlds/Rustage/world_resource_packs.json" "$BDS/valid_known_packs.json"

if [[ "${1:-}" == "--restart" ]]; then
  cd "$ROOT"
  docker compose -f "$ROOT/docker-compose.yml" restart bds
  docker compose -f "$ROOT/docker-compose.yml" up -d --force-recreate --no-deps waterdog
fi
