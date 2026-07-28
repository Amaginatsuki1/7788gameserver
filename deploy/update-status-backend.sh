#!/bin/sh
set -eu

source_file="${1:-/tmp/status_backend.py.new}"
target_file="/opt/7788-monitor/status_backend.py"
service_name="7788-status-backend"
backup_dir="/root/7788-monitor-backups/pre-status-backend-$(date +%Y%m%d-%H%M%S)"

restore_previous() {
  install -o root -g root -m 0755 \
    "$backup_dir/status_backend.py" \
    "$target_file"
  systemctl restart "$service_name"
}

cleanup() {
  rm -f "$source_file"
}
trap cleanup EXIT

/usr/bin/python3 -m py_compile "$source_file"
mkdir -p "$backup_dir"
cp -a "$target_file" "$backup_dir/status_backend.py"
install -o root -g root -m 0755 "$source_file" "$target_file"

if ! systemctl restart "$service_name"; then
  restore_previous
  echo "Backend restart failed; restored the previous file." >&2
  exit 1
fi

ready=false
for _attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 5 \
    http://127.0.0.1:8787/api/status 2>/dev/null |
    grep -q '"schemaVersion":1'; then
    ready=true
    break
  fi
  sleep 1
done

if [ "$ready" != "true" ]; then
  restore_previous
  echo "Backend health check failed; restored the previous file." >&2
  exit 1
fi

printf 'BACKUP=%s\n' "$backup_dir"
systemctl is-active "$service_name"
