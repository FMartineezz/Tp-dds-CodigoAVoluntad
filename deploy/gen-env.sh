#!/usr/bin/env bash
# Crea .env a partir de .env.example y reemplaza cada "GENERAR" por una clave aleatoria (hex).
# Hex a propósito: no tiene caracteres especiales que rompan la URI de Mongo.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo "Ya existe .env, no lo piso. Borralo si querés regenerarlo."
  exit 1
fi

cp .env.example .env
while grep -q 'GENERAR' .env; do
  secret=$(openssl rand -hex 24)
  sed -i "0,/GENERAR/s//${secret}/" .env
done
chmod 600 .env
echo ".env creado. Editalo para completar SMTP_USER / SMTP_PASSWORD (y revisar MONGODB_DB_NAME)."
