#!/bin/sh
set -e
# Reemplaza solo ${DOMAIN} (no toca las variables propias de nginx como $host)
envsubst '${DOMAIN}' < /etc/nginx/site.conf.template > /etc/nginx/conf.d/default.conf
# Recarga nginx cada 6 h para que tome los certificados renovados
( while :; do sleep 6h; nginx -s reload || true; done ) &
exec nginx -g 'daemon off;'
