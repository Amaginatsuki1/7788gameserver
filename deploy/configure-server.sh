#!/bin/sh
set -eu

# One-time provisioning for a dedicated aaPanel host, not a general installer.
if [ "${1:-}" != "--dedicated-aapanel-host" ]; then
  echo "This script changes SSH/firewall and disables MySQL, PHP and FTP." >&2
  echo "Review deploy/README.md and pass --dedicated-aapanel-host only on a dedicated host." >&2
  exit 2
fi
[ "$(id -u)" -eq 0 ]
test -d /www/server/panel/vhost/nginx
test -f /tmp/nginx-7788.conf
test -f /tmp/sshd-key-only.conf

stamp="$(date +%Y%m%d-%H%M%S)"

tar -czf "/root/7788-predeploy-${stamp}.tar.gz" \
  /www/server/panel/vhost/nginx \
  /www/server/nginx/conf/nginx.conf \
  /etc/ssh/sshd_config \
  /etc/ssh/sshd_config.d \
  2>/dev/null
ufw status numbered > "/root/7788-predeploy-firewall-${stamp}.txt"

install -m 0644 /tmp/nginx-7788.conf \
  /www/server/panel/vhost/nginx/7788.conf
if [ -f /tmp/nginx-7788-tls.conf ] &&
   [ -f /etc/letsencrypt/live/7788oio.icu/fullchain.pem ]; then
  install -m 0644 /tmp/nginx-7788-tls.conf \
    /www/server/panel/vhost/nginx/7788-tls.conf
fi
install -m 0644 /tmp/sshd-key-only.conf \
  /etc/ssh/sshd_config.d/99-7788-key-only.conf
if [ -f /tmp/certbot-reload-nginx.sh ]; then
  install -m 0755 /tmp/certbot-reload-nginx.sh \
    /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
fi

nginx -t
sshd -t
systemctl reload nginx
systemctl reload ssh

if [ -x /etc/init.d/mysqld ]; then
  SYSTEMCTL_SKIP_REDIRECT=1 /etc/init.d/mysqld stop 2>/dev/null || true
fi
for service in mysqld php-fpm-82 pure-ftpd vsftpd proftpd; do
  systemctl stop "$service" 2>/dev/null || true
  systemctl disable "$service" 2>/dev/null || true
done

for rule in \
  20/tcp \
  21/tcp \
  888/tcp \
  31058/tcp \
  39000:40000/tcp
do
  ufw --force delete allow "$rule" >/dev/null 2>&1 || true
done

for rule in 22/tcp 80/tcp 443/tcp 8889/tcp; do
  ufw allow "$rule" >/dev/null
done

systemctl enable nginx >/dev/null 2>&1 || true
systemctl enable ssh >/dev/null 2>&1 || true
systemctl enable bt >/dev/null 2>&1 || true

rm -f \
  /tmp/nginx-7788.conf \
  /tmp/nginx-7788-tls.conf \
  /tmp/certbot-reload-nginx.sh \
  /tmp/sshd-key-only.conf \
  /tmp/configure-server.sh

echo "SERVER_CONFIGURED"
echo "--- SSH ---"
sshd -T | grep -E \
  '^(passwordauthentication|permitrootlogin|pubkeyauthentication) '
echo "--- FIREWALL ---"
ufw status
echo "--- LISTEN ---"
ss -lntup
echo "--- RELEASE ---"
readlink -f /srv/7788/current 2>/dev/null || true
echo "--- SERVICES ---"
systemctl is-active nginx ssh bt mysqld php-fpm-82 \
  pure-ftpd vsftpd proftpd || true
