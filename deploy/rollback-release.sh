#!/bin/sh
set -eu

requested="${1:-}"
case "$requested" in *[!A-Za-z0-9_-]*) echo "Invalid release name" >&2; exit 2;; esac
site_root="${SITE_ROOT:-/srv/7788}"
current="$(readlink -f "$site_root/current")"
test -d "$current"
previous=""
if [ -n "$requested" ]; then
  previous="$site_root/releases/$requested"
elif [ -f "$current/.previous-release" ]; then
  name="$(cat "$current/.previous-release")"
  case "$name" in ''|*[!A-Za-z0-9_-]*) echo "Invalid previous release marker" >&2; exit 2;; esac
  if [ -f "$site_root/releases/$name/index.html" ] && [ ! -f "$site_root/releases/$name/.failed" ]; then
    previous="$site_root/releases/$name"
  fi
fi
if [ -z "$previous" ]; then
  current_name="$(basename "$current")"
  previous="$(
    find "$site_root/releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
      sort -r |
      while IFS= read -r name; do
        candidate="$site_root/releases/$name"
        # Legacy releases have no health marker. Only consider older releases.
        if [ "$name" \< "$current_name" ] && [ -f "$candidate/index.html" ] && [ ! -f "$candidate/.failed" ]; then
          printf '%s\n' "$candidate"
          break
        fi
      done
  )"
fi
if [ -z "$previous" ] || [ "$previous" = "$current" ] || [ ! -f "$previous/index.html" ] || [ -f "$previous/.failed" ]; then
  echo "No eligible rollback release; specify a retained version explicitly." >&2
  exit 1
fi
nginx -t
switched=false
finish() {
  code=$?
  trap - EXIT HUP INT TERM
  if [ "$code" -ne 0 ] && [ "$switched" = true ]; then
    ln -sfn "$current" "$site_root/current.next"
    mv -Tf "$site_root/current.next" "$site_root/current"
    echo "Rollback health check failed; restored the original release." >&2
  fi
  exit "$code"
}
trap finish EXIT
trap 'exit 1' HUP INT TERM
ln -sfn "$previous" "$site_root/current.next"
mv -Tf "$site_root/current.next" "$site_root/current"
switched=true
for route in / /terraria /terraria/join /minecraft /minecraft/join /status /updates /mod-development; do
  curl -fsS --max-time 10 --resolve 7788oio.icu:443:127.0.0.1 "https://7788oio.icu$route" >/dev/null
done
curl -fsS --max-time 10 --resolve 7788oio.icu:443:127.0.0.1 https://7788oio.icu/api/status |
  grep -q '"schemaVersion":1'
switched=false
printf 'Rolled back to %s\n' "$(basename "$previous")"
