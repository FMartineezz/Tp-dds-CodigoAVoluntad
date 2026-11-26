#!/usr/bin/env bash
# Primer arranque: levanta todo y obtiene el certificado HTTPS de Let's Encrypt.
# Se puede volver a correr sin problema.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Falta .env. Corré primero: ./deploy/gen-env.sh"; exit 1; }
set -a; source .env; set +a
: "${DOMAIN:?Falta DOMAIN en .env}" "${LETSENCRYPT_EMAIL:?Falta LETSENCRYPT_EMAIL en .env}"

CONF=certbot/conf
LIVE=$CONF/live/$DOMAIN
mkdir -p certbot/www "$CONF"

# Si ya hay un certificado real, solo levanto el stack
if [ -f "$LIVE/fullchain.pem" ] && [ ! -f "$CONF/.dummy" ]; then
  echo "Ya existe un certificado para $DOMAIN. Levanto el stack."
  docker compose up -d --build
  exit 0
fi

echo "### 1/5 Creando certificado temporal (para que nginx pueda arrancar)..."
mkdir -p "$LIVE"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$LIVE/privkey.pem" -out "$LIVE/fullchain.pem" -subj "/CN=localhost" 2>/dev/null
touch "$CONF/.dummy"

echo "### 2/5 Construyendo y levantando los servicios..."
docker compose up -d --build

echo "### 3/5 Esperando a nginx..."
sleep 8

echo "### 4/5 Pidiendo el certificado real a Let's Encrypt para $DOMAIN..."
docker compose run --rm --entrypoint sh certbot -c \
  "rm -rf /etc/letsencrypt/live/$DOMAIN /etc/letsencrypt/archive/$DOMAIN /etc/letsencrypt/renewal/$DOMAIN.conf"

STAGING_ARG=""
[ "${STAGING:-0}" = "1" ] && STAGING_ARG="--staging" && echo "(modo STAGING: certificado de prueba)"

docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email --non-interactive \
  $STAGING_ARG

rm -f "$CONF/.dummy"

echo "### 5/5 Recargando nginx con el certificado real..."
docker compose exec nginx nginx -s reload

echo
echo "Listo. Probá:  curl https://$DOMAIN/api/healthCheck"
