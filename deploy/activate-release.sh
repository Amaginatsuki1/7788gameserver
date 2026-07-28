#!/bin/sh
set -eu

archive="${1:-/tmp/7788-web-upload.tar.gz}"
release_name="$(date +%Y%m%d-%H%M%S)-reinstall"
release="/srv/7788/releases/${release_name}"
previous="$(readlink -f /srv/7788/current 2>/dev/null || true)"

mkdir -p "$release"
tar --warning=no-timestamp -xzf "$archive" -C "$release"
ln -sfn "$release" /srv/7788/current.next
mv -Tf /srv/7788/current.next /srv/7788/current
rm -f "$archive"

if ! nginx -t ||
   ! test -f /srv/7788/current/index.html ||
   ! curl -fsS --max-time 10 \
       -H 'Host: 7788oio.icu' http://127.0.0.1/ >/dev/null
then
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    ln -sfn "$previous" /srv/7788/current.next
    mv -Tf /srv/7788/current.next /srv/7788/current
  fi
  echo "Release health check failed; restored the previous release." >&2
  exit 1
fi

find /srv/7788/releases -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
  sort -r |
  tail -n +6 |
  while IFS= read -r old_release; do
    rm -rf -- "/srv/7788/releases/$old_release"
  done

printf 'ACTIVATED=%s\n' "$release_name"
