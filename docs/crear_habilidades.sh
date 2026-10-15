#!/bin/bash

# URL del endpoint
URL="http://localhost:3000/habilidades"

# Array de habilidades en formato JSON
habilidades=(
  '{
    "titulo": "Programacion en JavaScript", 
    "descripcion": "Capacidad para desarrollar aplicaciones web y logica de negocio utilizando JS moderno."}'
  '{
    "titulo": "Desarrollo con Node.js y Express", 
    "descripcion": "Creacion de APIs RESTful, ruteo y manejo de middleware."}'
  '{
    "titulo": "Control de versiones con Git", 
    "descripcion": "Manejo de repositorios, ramas y flujo de trabajo colaborativo."
  }'
  '{
    "titulo": "Disenio y Documentacion de APIs con OpenAPI",
    "descripcion": "Definicion de contratos de servicio RESTful, esquemas de datos y especificaciones OpenAPI/Swagger."
  }'
  '{
    "titulo": "Pruebas de Integracion con Postman",
    "descripcion": "Disenio y ejecucion de colecciones de pruebas automatizadas para la verificacion de endpoints HTTP."
  }'
)

echo "Iniciando envío de habilidades a $URL"
echo "----------------------------------------"

# Iterar sobre cada habilidad y realizar la petición POST
for json in "${habilidades[@]}"; do
  echo "Enviando habilidad..."
  
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