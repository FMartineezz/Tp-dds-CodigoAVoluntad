#!/bin/bash

# URL del endpoint
URL="http://localhost:3000/colectivos"

# Array de colectivos en formato JSON
colectivos=(
    '{
    "nombre": "Colectivo Ambiental CABA",
    "descripcion": "Organizacion dedicada a promover el cuidado del medio ambiente y la sustentabilidad en la Ciudad de Buenos Aires.",
    "ubicacion": "caba",
    "tipoDeColectivo": "fundacion",
    "proyectos": []
    }'
  '{
    "nombre": "Red de Huertas de Palermo",
    "descripcion": "Colectivo de vecinos enfocado en la agricultura urbana, el compostaje comunitario y el intercambio de semillas.",
    "ubicacion": "caba",
    "tipoDeColectivo": "asociacion barrial",
    "proyectos": []
  }'
  '{
    "nombre": "Asamblea Abierta por los Espacios Verdes",
    "descripcion": "Espacio horizontal de discusion y accion ciudadana para defender los parques publicos e impulsar proyectos ecologicos.",
    "ubicacion": "caba",
    "tipoDeColectivo": "asamblea",
    "proyectos": []
  }'
)

echo "Iniciando envío de colectivos a $URL"
echo "----------------------------------------"

# Iterar sobre cada habilidad y realizar la petición POST
for json in "${colectivos[@]}"; do
  echo "Enviando colectivo..."
  
  respuesta=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "$json")

  # Extraer el código de estado HTTP y el cuerpo
  http_status=$(echo "$respuesta" | grep "HTTP_STATUS" | awk -F: '{print $2}')
  cuerpo=$(echo "$respuesta" | sed -e 's/HTTP_STATUS:.*//g')

  echo "Respuesta del servidor (HTTP $http_status):"
  echo "$cuerpo"
  echo "----------------------------------------"
done

echo "Proceso finalizado."