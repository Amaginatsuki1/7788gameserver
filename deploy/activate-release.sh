#!/bin/sh
set -eu

archive="${1:?Usage: activate-release.sh archive [release-name]}"
release_name="${2:-$(date +%Y%m%d-%H%M%S)-reinstall}"
case "$release_name" in ''|*[!A-Za-z0-9_-]*) echo "Invalid release name" >&2; exit 2;; esac
site_root="${SITE_ROOT:-/srv/7788}"
release="$site_root/releases/$release_name"
previous="$(readlink -e "$site_root/current" 2>/dev/null || true)"
# Never overwrite a retained release.
mkdir -p "$site_root/releases"
mkdir "$release"
tar --warning=no-timestamp -xzf "$archive" -C "$release"
test -f "$release/index.html"
nginx -t
switched=false
finish() {
  code=$?
  trap - EXIT HUP INT TERM
  if [ "$code" -ne 0 ] && [ "$switched" = true ]; then
    touch "$release/.failed"
    if [ -n "$previous" ] && [ -d "$previous" ]; then
      ln -sfn "$previous" "$site_root/current.next"
      mv -Tf "$site_root/current.next" "$site_root/current"
    else
      rm -f "$site_root/current"
    fi
    echo "Activation failed; restored the previous release." >&2
  fi
  exit "$code"
}
trap finish EXIT
trap 'exit 1' HUP INT TERM
ln -sfn "$release" "$site_root/current.next"
mv -Tf "$site_root/current.next" "$site_root/current"
switched=true
for route in / /terraria /terraria/join /minecraft /minecraft/join /status /updates /mod-development; do
  curl -fsS --max-time 10 --resolve 7788oio.icu:443:127.0.0.1 "https://7788oio.icu$route" >/dev/null
done
curl -fsS --max-time 10 --resolve 7788oio.icu:443:127.0.0.1 https://7788oio.icu/api/status |
  grep -q '"schemaVersion":1'
if [ -n "$previous" ]; then basename "$previous" > "$release/.previous-release"; fi
touch "$release/.healthy"
switched=false
rm -f "$archive"
# Keep the active release and its immediate rollback target even after a rollback.
find "$site_root/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
  sort -r | tail -n +6 |
  while IFS= read -r old_release; do
    candidate="$site_root/releases/$old_release"
    if [ "$candidate" != "$release" ] && [ "$candidate" != "$previous" ]; then
      rm -rf -- "$candidate"
    fi
  done
printf 'ACTIVATED=%s\n' "$release_name"
