#!/bin/sh
set -u

check_routes() {
  scheme="$1"
  echo "--- $(printf '%s' "$scheme" | tr '[:lower:]' '[:upper:]') ROUTES ---"
  for path in \
    / \
    /terraria \
    /terraria/join \
    /minecraft \
    /minecraft/join \
    /status \
    /updates \
    /latency-probe.txt \
    /missing-check
  do
    if [ "$scheme" = "https" ]; then
      code="$(
        curl -sS -o /dev/null -w '%{http_code}' \
          --resolve 7788oio.icu:443:127.0.0.1 \
          --max-time 10 "https://7788oio.icu${path}"
      )"
    else
      code="$(
        curl -sS -o /dev/null -w '%{http_code}' \
          -H 'Host: 7788oio.icu' \
          --max-time 10 "http://127.0.0.1${path}"
      )"
    fi
    printf '%s %s\n' "$code" "$path"
  done
}

check_status_api() {
  echo "--- STATUS API ---"
  body="$(
    curl -fsS \
      --resolve 7788oio.icu:443:127.0.0.1 \
      --max-time 10 "https://7788oio.icu/api/status"
  )" || {
    echo "FAIL /api/status"
    return 1
  }

  if printf '%s' "$body" | grep -q '"schemaVersion":1'; then
    echo "200 /api/status schemaVersion=1"
  else
    echo "FAIL /api/status schemaVersion"
    return 1
  fi
}

check_routes http
if [ -f /etc/letsencrypt/live/7788oio.icu/fullchain.pem ]; then
  check_routes https
  check_status_api
fi

echo "--- SERVICES ---"
for service in ssh nginx bt mysqld php-fpm-82 pure-ftpd vsftpd proftpd; do
  printf '%s=' "$service"
  systemctl is-active "$service" 2>/dev/null || true
done

echo "--- PORTS ---"
ss -lntup

echo "--- FIREWALL ---"
ufw status

echo "--- SSH ---"
sshd -T |
  grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication) '

echo "--- RELEASE ---"
readlink -f /srv/7788/current 2>/dev/null || true
