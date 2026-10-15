# API — Código a Voluntad

Documentación de los endpoints implementados en `packages/backend`. La misma información está en Swagger: con el backend levantado, entrá a `/api-docs`.

## Info general

- **Base URL:** `http://localhost:{SERVER_PORT}` (`8000` con el `.env.example`; `3000` si no se define `SERVER_PORT`)
- **Persistencia:** MongoDB. Todos los ids son ObjectId (strings de 24 caracteres hex).
- **Formato:** todos los bodies de request/response son `application/json`
- **Formato de error estándar:**

  ```json
  {
    "code": "ERR-XXX-000",
    "message": "Descripción del error"
  }
  ```

  Los códigos salen de `errorCatalog.js`. Si ocurre un error no controlado, se devuelve `500` con `code: "ERR-CSR-500"`. Esto también pasa hoy si un id de la ruta no tiene formato de ObjectId (por ejemplo `/proyectos/abc`).

- **Altas:** las respuestas `201` incluyen el header `Location` con la URL del recurso creado (salvo los mensajes).
- **Lecturas:** los `GET` devuelven los documentos tal como están en la base: con `_id`, `createdAt`, `updatedAt` y `__v`, y las referencias a otras entidades como ids.

### Índice

| Recurso                           | Endpoints                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Health Check](#health-check)     | `GET /healthCheck`                                                                                                |
| [Habilidades](#habilidades)       | `GET /habilidades`, `GET /habilidades/:id`, `POST /habilidades`                                                   |
| [Colectivos](#colectivos)         | `GET /colectivos`, `GET /colectivos/:id`, `POST /colectivos`                                                      |
| [Colaboradoras](#colaboradoras)   | `GET /colaboradoras`, `GET /colaboradoras/:id`, `POST /colaboradoras`                                             |
| [Proyectos](#proyectos)           | `GET /proyectos`, `GET /proyectos/:id`, `POST /proyectos`, `PATCH /proyectos/:id`                                 |
| [Perfiles](#perfiles)             | `GET`, `POST /proyectos/:idProyecto/perfiles`; `GET`, `PATCH`, `DELETE /proyectos/:idProyecto/perfiles/:idPerfil` |
| [Logros](#logros)                 | `GET`, `POST /proyectos/:proyectoId/logros`; `GET`, `PATCH`, `DELETE /proyectos/:proyectoId/logros/:logroId`      |
| [Colaboraciones](#colaboraciones) | `GET /colaboraciones`, `GET /colaboraciones/:id`, `POST /colaboraciones`                                          |
| [Búsquedas](#búsquedas)           | `GET /proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes`, `GET /colaboradoras/:id/proyectos-acordes` |
| [Mensajes](#mensajes)             | `POST /colectivos/:colectivoId/mensajes`, `GET /colaboradoras/:personaColaboradoraId/mensajes`                    |

---

## Health Check

### GET `/healthCheck`

**Respuesta 200:**

```json
{ "status": "ok", "uptime": 24.72, "timestamp": "2026-10-14T19:22:31.337Z" }
```

---

## Habilidades

| Método | Path               | Descripción                  |
| ------ | ------------------ | ---------------------------- |
| GET    | `/habilidades`     | Lista todas las habilidades  |
| GET    | `/habilidades/:id` | Obtiene una habilidad por id |
| POST   | `/habilidades`     | Crea una habilidad           |

### GET `/habilidades`

**Respuesta 200:**

```json
[
  {
    "_id": "6acfd66164d02459ba8dc69c",
    "titulo": "Desarrollo Web React",
    "codigo": "desarrollo_web_react",
    "descripcion": "Desarrollo de interfaces con React.",
    "createdAt": "2026-10-14T19:22:09.692Z",
    "updatedAt": "2026-10-14T19:22:09.692Z",
    "__v": 0
  }
]
```

### GET `/habilidades/:id`

**Respuesta 200:** objeto habilidad (igual forma que arriba)

**Errores:**

| Status | code          | Cuándo                             |
| ------ | ------------- | ---------------------------------- |
| 404    | `ERR-NOT-204` | No existe una habilidad con ese id |

### POST `/habilidades`

**Body:**

| Campo         | Tipo   | Requerido | Notas                                                            |
| ------------- | ------ | --------- | ---------------------------------------------------------------- |
| `titulo`      | string | sí        | debe ser único. Se normaliza a `codigo` en snake_case (ver nota) |
| `descripcion` | string | sí        |                                                                  |

> **Nota sobre `codigo`:** se genera con `lodash.snakeCase`, que separa los números. Por ejemplo, `"Testing E2E"` queda `testing_e_2_e`. Las demás entidades referencian habilidades por este código.

**Respuesta 201:**

```json
{
  "id": "6acfd66164d02459ba8dc69c",
  "titulo": "Desarrollo Web React",
  "codigo": "desarrollo_web_react",
  "descripcion": "Desarrollo de interfaces con React."
}
```

**Errores:**

| Status | code          | Cuándo                                         |
| ------ | ------------- | ---------------------------------------------- |
| 400    | `ERR-VAL-201` | Falta `titulo`                                 |
| 400    | `ERR-VAL-202` | Falta `descripcion`                            |
| 400    | `ERR-VAL-001` | `titulo` o `descripcion` no son de tipo string |
| 409    | `ERR-CSR-206` | Ya existe una habilidad con ese `titulo`       |

---

## Colectivos

| Método | Path              | Descripción                 |
| ------ | ----------------- | --------------------------- |
| GET    | `/colectivos`     | Lista todos los colectivos  |
| GET    | `/colectivos/:id` | Obtiene un colectivo por id |
| POST   | `/colectivos`     | Crea un colectivo           |

### GET `/colectivos`

**Respuesta 200:**

```json
[
  {
    "_id": "6acfd66164d02459ba8dc69f",
    "nombre": "Fundación Ejemplo",
    "descripcion": "Texto breve que describe a Fundación Ejemplo",
    "ubicacion": "caba",
    "tipoDeColectivo": "fundacion",
    "proyectos": ["6acfd66264d02459ba8dc6a2"],
    "createdAt": "2026-10-14T19:22:09.939Z",
    "updatedAt": "2026-10-14T19:22:10.081Z",
    "__v": 0
  }
]
```

`proyectos` contiene los ids de los proyectos del colectivo.

### GET `/colectivos/:id`

**Respuesta 200:** objeto colectivo (igual forma que arriba)

**Errores:**

| Status | code          | Cuándo                            |
| ------ | ------------- | --------------------------------- |
| 404    | `ERR-NOT-305` | No existe un colectivo con ese id |

### POST `/colectivos`

**Body:**

| Campo             | Tipo          | Requerido | Notas                                                                                                     |
| ----------------- | ------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `nombre`          | string        | sí        | debe ser único                                                                                            |
| `descripcion`     | string        | sí        |                                                                                                           |
| `ubicacion`       | string (enum) | sí        | en minúsculas y sin tildes: `argentina`, `caba` o una provincia (ej. `buenos aires`, `cordoba`). Ver nota |
| `tipoDeColectivo` | string (enum) | sí        | uno de: `fundacion`, `ong`, `asociacion barrial`, `asamblea`                                              |

> **Nota sobre `ubicacion`:** el enunciado la define como opcional, pero hoy la base de datos la exige. Si falta o no es un valor válido, la respuesta es `500`.

**Respuesta 201:** objeto colectivo creado, con `id` en lugar de `_id` y sin timestamps.

**Errores:**

| Status | code          | Cuándo                                             |
| ------ | ------------- | -------------------------------------------------- |
| 400    | `ERR-VAL-301` | Falta `nombre`                                     |
| 400    | `ERR-VAL-302` | Falta `descripcion`                                |
| 400    | `ERR-VAL-304` | Falta `tipoDeColectivo`                            |
| 400    | `ERR-VAL-307` | `tipoDeColectivo` no es uno de los valores válidos |
| 400    | `ERR-VAL-001` | `nombre` o `descripcion` no son de tipo string     |
| 409    | `ERR-CSR-308` | Ya existe un colectivo con ese `nombre`            |

---

## Colaboradoras

| Método | Path                 | Descripción                             |
| ------ | -------------------- | --------------------------------------- |
| GET    | `/colaboradoras`     | Lista todas las personas colaboradoras  |
| GET    | `/colaboradoras/:id` | Obtiene una persona colaboradora por id |
| POST   | `/colaboradoras`     | Registra una persona colaboradora       |

Los medios de contacto (`contactos`) quedan registrados internamente y **nunca** aparecen en los `GET`.

### GET `/colaboradoras`

**Respuesta 200:**

```json
[
  {
    "_id": "6acfd66264d02459ba8dc6a0",
    "nombreFantasia": "devSolidario",
    "git": "https://github.com/devSolidario",
    "nombre": "Ana",
    "apellido": "Pérez",
    "habilidades": ["6acfd66164d02459ba8dc69c"],
    "pronombres": "ella",
    "presentacion": "Desarrolladora front interesada en proyectos comunitarios.",
    "bloquearMensajeInterno": false,
    "createdAt": "2026-10-14T19:22:10.011Z",
    "updatedAt": "2026-10-14T19:22:10.011Z",
    "__v": 0
  }
]
```

`habilidades` contiene los ids de sus habilidades.

### GET `/colaboradoras/:id`

**Respuesta 200:** objeto persona colaboradora (igual forma que arriba)

**Errores:**

| Status | code          | Cuándo                                        |
| ------ | ------------- | --------------------------------------------- |
| 404    | `ERR-NOT-405` | No existe una persona colaboradora con ese id |

### POST `/colaboradoras`

**Body:**

| Campo                    | Tipo     | Requerido | Notas                                                                            |
| ------------------------ | -------- | --------- | -------------------------------------------------------------------------------- |
| `nombreFantasia`         | string   | sí        |                                                                                  |
| `git`                    | string   | sí        | cuenta de GitHub o GitLab                                                        |
| `nombre`                 | string   | no        |                                                                                  |
| `apellido`               | string   | no        |                                                                                  |
| `habilidades`            | string[] | sí        | array de **códigos** de habilidad ya existentes (no títulos ni ids)              |
| `pronombres`             | string   | no        |                                                                                  |
| `presentacion`           | string   | sí        |                                                                                  |
| `contactos`              | object[] | no        | cero o más medios de contacto: `{ "tipo": "email", "valor": "ana@mail.com" }`    |
| `bloquearMensajeInterno` | boolean  | no        | `true` si no quiere recibir mensajes internos de los colectivos. Default `false` |

**Medios de contacto:** `tipo` es uno de `email`, `whatsapp` o `sms` (en mayúsculas o minúsculas). Para `email`, `valor` debe ser un email válido; para `whatsapp` y `sms`, 10 dígitos juntos sin espacios ni símbolos (ej. `1127891234`).

**Respuesta 201:** la persona creada, con `id` en lugar de `_id`, las habilidades completas y sus `contactos`.

**Errores:**

| Status | code          | Cuándo                                           |
| ------ | ------------- | ------------------------------------------------ |
| 400    | `ERR-VAL-401` | Falta `nombreFantasia`                           |
| 400    | `ERR-VAL-402` | Falta `git`                                      |
| 400    | `ERR-VAL-403` | Falta `habilidades`                              |
| 400    | `ERR-VAL-404` | Falta `presentacion`                             |
| 400    | `ERR-VAL-406` | `habilidades` no es un array de strings          |
| 400    | `ERR-VAL-407` | `bloquearMensajeInterno` no es booleano          |
| 400    | `ERR-VAL-701` | `contactos` no es una lista                      |
| 400    | `ERR-VAL-702` | Un contacto no tiene `tipo`                      |
| 400    | `ERR-VAL-703` | El `tipo` no es `email`, `whatsapp` ni `sms`     |
| 400    | `ERR-VAL-704` | Un contacto no tiene `valor`                     |
| 400    | `ERR-VAL-705` | `valor` no es un texto                           |
| 400    | `ERR-VAL-706` | El email no tiene formato válido                 |
| 400    | `ERR-VAL-707` | El teléfono no tiene 10 dígitos                  |
| 400    | `ERR-VAL-207` | Alguno de los códigos en `habilidades` no existe |
| 400    | `ERR-VAL-001` | Algún campo de texto no es de tipo string        |

---

## Proyectos

| Método | Path             | Descripción                          |
| ------ | ---------------- | ------------------------------------ |
| GET    | `/proyectos`     | Lista todos los proyectos            |
| GET    | `/proyectos/:id` | Obtiene un proyecto por id           |
| POST   | `/proyectos`     | Crea un proyecto con sus perfiles    |
| PATCH  | `/proyectos/:id` | Finaliza un proyecto (cierre manual) |

### GET `/proyectos`

**Respuesta 200:**

```json
[
  {
    "_id": "6acfd66264d02459ba8dc6a2",
    "titulo": "Sitio web institucional",
    "descripcion": "Sitio de la fundación",
    "perfiles": [
      {
        "_id": "6acfd66264d02459ba8dc6a3",
        "descripcion": "Desarrollo front",
        "habilidadesRequeridas": ["6acfd66164d02459ba8dc69c"],
        "habilidadesOpcionales": ["6acfd66164d02459ba8dc69d"],
        "horas": 5,
        "tipoDeCompromiso": "mensual",
        "modalidadDeColaboracion": "gratuita",
        "createdAt": "2026-10-14T19:22:10.073Z",
        "updatedAt": "2026-10-14T19:22:10.073Z"
      }
    ],
    "colectivo": "6acfd66164d02459ba8dc69f",
    "urlSistema": "https://fundacion.org",
    "logros": [
      {
        "_id": "6acfd66a64d02459ba8dc6a9",
        "descripcion": "MVP publicado",
        "porcentaje": 60,
        "urlCodigoFuente": "https://github.com/fundacion/web",
        "createdAt": "2026-10-14T19:22:18.292Z",
        "updatedAt": "2026-10-14T19:22:18.292Z"
      }
    ],
    "finalizado": false,
    "createdAt": "2026-10-14T19:22:10.073Z",
    "updatedAt": "2026-10-14T19:22:18.327Z",
    "__v": 0
  }
]
```

`colectivo` es el id del colectivo; en los perfiles, las habilidades son ids.

### GET `/proyectos/:id`

**Respuesta 200:** objeto proyecto (igual forma que arriba)

**Errores:**

| Status | code          | Cuándo                           |
| ------ | ------------- | -------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id |

### POST `/proyectos`

**Body:**

| Campo         | Tipo     | Requerido | Notas                                                 |
| ------------- | -------- | --------- | ----------------------------------------------------- |
| `titulo`      | string   | sí        | no puede repetirse dentro del mismo colectivo         |
| `descripcion` | string   | sí        |                                                       |
| `perfiles`    | object[] | sí        | al menos un perfil (ver abajo)                        |
| `colectivo`   | string   | sí        | **nombre** del colectivo existente (no id, no objeto) |
| `urlSistema`  | string   | sí        | URL válida del sistema en funcionamiento              |

**Cada perfil:**

| Campo                     | Tipo          | Requerido | Notas                                                              |
| ------------------------- | ------------- | --------- | ------------------------------------------------------------------ |
| `descripcion`             | string        | sí        |                                                                    |
| `habilidadesRequeridas`   | string[]      | sí        | al menos una; **códigos** de habilidades existentes                |
| `habilidadesOpcionales`   | string[]      | sí        | al menos una; **códigos** de habilidades existentes                |
| `horas`                   | number        | sí        |                                                                    |
| `tipoDeCompromiso`        | string (enum) | sí        | uno de: `total`, `semanal`, `mensual`                              |
| `modalidadDeColaboracion` | string (enum) | sí        | uno de: `gratuita`, `incentivo_economico`, `contratacion_eventual` |

**Ejemplo:**

```json
{
  "titulo": "Sitio web institucional",
  "descripcion": "Sitio de la fundación",
  "colectivo": "Fundación Ejemplo",
  "urlSistema": "https://fundacion.org",
  "perfiles": [
    {
      "descripcion": "Desarrollo front",
      "habilidadesRequeridas": ["desarrollo_web_react"],
      "habilidadesOpcionales": ["testing_e_2_e"],
      "horas": 5,
      "tipoDeCompromiso": "mensual",
      "modalidadDeColaboracion": "gratuita"
    }
  ]
}
```

**Respuesta 201:** el proyecto creado (misma forma que el `GET`), abierto y sin logros. También queda agregado a la lista `proyectos` de su colectivo.

**Errores:**

| Status | code          | Cuándo                                                            |
| ------ | ------------- | ----------------------------------------------------------------- |
| 400    | `ERR-VAL-101` | Falta `titulo`                                                    |
| 400    | `ERR-VAL-102` | Falta `descripcion`                                               |
| 400    | `ERR-VAL-103` | Falta `perfiles`, no es un array o está vacío                     |
| 400    | `ERR-VAL-107` | Falta `colectivo`                                                 |
| 400    | `ERR-VAL-112` | `colectivo` no es un string (nombre)                              |
| 400    | `ERR-VAL-115` | Falta `urlSistema` o no es una URL válida                         |
| 400    | `ERR-VAL-601` | Falta la `descripcion` de un perfil                               |
| 400    | `ERR-VAL-602` | Faltan `habilidadesRequeridas` o está vacío                       |
| 400    | `ERR-VAL-603` | Faltan `habilidadesOpcionales` o está vacío                       |
| 400    | `ERR-VAL-604` | Faltan `horas`                                                    |
| 400    | `ERR-VAL-605` | Falta `tipoDeCompromiso`                                          |
| 400    | `ERR-VAL-606` | Falta `modalidadDeColaboracion`                                   |
| 400    | `ERR-VAL-607` | `habilidadesRequeridas` no es un array de strings                 |
| 400    | `ERR-VAL-608` | `habilidadesOpcionales` no es un array de strings                 |
| 400    | `ERR-VAL-609` | `tipoDeCompromiso` no es un valor válido                          |
| 400    | `ERR-VAL-610` | `modalidadDeColaboracion` no es un valor válido                   |
| 400    | `ERR-NOT-306` | No existe un colectivo con ese nombre                             |
| 400    | `ERR-VAL-207` | Alguno de los códigos de habilidad no existe                      |
| 400    | `ERR-VAL-001` | Algún campo de texto no es de tipo string, u `horas` no es número |
| 409    | `ERR-CSR-110` | El colectivo ya tiene un proyecto con ese título                  |

### PATCH `/proyectos/:id`

Cierre manual del proyecto. Después de finalizarlo ya no se pueden anotar colaboradoras ni cargar logros.

**Body:** por ahora la única modificación soportada es:

```json
{ "finalizado": true }
```

**Respuesta 200:** el proyecto actualizado, con `finalizado: true` (misma forma que el `GET`).

**Errores:**

| Status | code          | Cuándo                                          |
| ------ | ------------- | ----------------------------------------------- |
| 400    | `ERR-VAL-001` | El body es distinto de `{ "finalizado": true }` |
| 400    | `ERR-EST-109` | El proyecto ya estaba finalizado                |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id                |

---

## Perfiles

Los perfiles existen solo dentro de un proyecto, así que todas las rutas cuelgan de `/proyectos/:idProyecto`.

| Método | Path                                        | Descripción                     |
| ------ | ------------------------------------------- | ------------------------------- |
| GET    | `/proyectos/:idProyecto/perfiles`           | Lista los perfiles del proyecto |
| POST   | `/proyectos/:idProyecto/perfiles`           | Agrega un perfil al proyecto    |
| GET    | `/proyectos/:idProyecto/perfiles/:idPerfil` | Obtiene un perfil por id        |
| PATCH  | `/proyectos/:idProyecto/perfiles/:idPerfil` | Modifica un perfil              |
| DELETE | `/proyectos/:idProyecto/perfiles/:idPerfil` | Elimina un perfil               |

### GET `/proyectos/:idProyecto/perfiles`

**Respuesta 200:** array de perfiles (misma forma que `perfiles` en el `GET` de proyecto)

**Errores:**

| Status | code          | Cuándo                           |
| ------ | ------------- | -------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id |

### GET `/proyectos/:idProyecto/perfiles/:idPerfil`

**Respuesta 200:** objeto perfil

**Errores:**

| Status | code          | Cuándo                                    |
| ------ | ------------- | ----------------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id          |
| 404    | `ERR-NOT-611` | El proyecto no tiene un perfil con ese id |

### POST `/proyectos/:idProyecto/perfiles`

**Body:** igual que cada perfil en `POST /proyectos` (`descripcion`, `habilidadesRequeridas`, `habilidadesOpcionales`, `horas`, `tipoDeCompromiso`, `modalidadDeColaboracion`). Las habilidades se indican por **código**.

**Respuesta 201:** el perfil creado, con su `_id` y las habilidades como ids.

```json
{
  "_id": "6acfd66264d02459ba8dc6a5",
  "descripcion": "Tester",
  "habilidadesRequeridas": ["6acfd66164d02459ba8dc69d"],
  "habilidadesOpcionales": ["6acfd66164d02459ba8dc69c"],
  "horas": 5,
  "tipoDeCompromiso": "mensual",
  "modalidadDeColaboracion": "gratuita",
  "createdAt": "2026-10-14T19:22:10.179Z",
  "updatedAt": "2026-10-14T19:22:10.179Z"
}
```

> **Ojo:** hoy no se verifica que el proyecto exista. Con un id válido pero inexistente, responde `201` con `null`.

**Errores:** los mismos de validación de perfil que en `POST /proyectos` (`ERR-VAL-601` a `ERR-VAL-610`, `ERR-VAL-001`), y `ERR-VAL-207` si algún código de habilidad no existe.

### PATCH `/proyectos/:idProyecto/perfiles/:idPerfil`

Modificación parcial: se manda solo lo que cambia, pero al menos un campo. Si vienen `habilidadesRequeridas` u `habilidadesOpcionales`, se indican por **código** y reemplazan la lista anterior.

```json
{ "horas": 8, "habilidadesOpcionales": ["desarrollo_web_react"] }
```

**Respuesta 200:** el perfil actualizado.

**Errores:**

| Status | code                          | Cuándo                                        |
| ------ | ----------------------------- | --------------------------------------------- |
| 400    | `ERR-VAL-001`                 | El body está vacío o un campo es de otro tipo |
| 400    | `ERR-VAL-601` a `ERR-VAL-610` | Algún campo enviado no pasa la validación     |
| 400    | `ERR-VAL-207`                 | Algún código de habilidad no existe           |
| 404    | `ERR-NOT-108`                 | No existe un proyecto con ese id              |
| 404    | `ERR-NOT-611`                 | El proyecto no tiene un perfil con ese id     |

### DELETE `/proyectos/:idProyecto/perfiles/:idPerfil`

**Respuesta 200:** el perfil eliminado.

**Errores:**

| Status | code          | Cuándo                                    |
| ------ | ------------- | ----------------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id          |
| 404    | `ERR-NOT-611` | El proyecto no tiene un perfil con ese id |

---

## Logros

Los logros dan trazabilidad al avance del proyecto. Cada uno aporta un porcentaje de concreción, y la suma de los logros de un proyecto no puede superar 100%. El enlace al sistema en funcionamiento es el `urlSistema` del proyecto.

| Método | Path                                     | Descripción                   |
| ------ | ---------------------------------------- | ----------------------------- |
| GET    | `/proyectos/:proyectoId/logros`          | Lista los logros del proyecto |
| POST   | `/proyectos/:proyectoId/logros`          | Carga un logro en un proyecto |
| GET    | `/proyectos/:proyectoId/logros/:logroId` | Obtiene un logro por id       |
| PATCH  | `/proyectos/:proyectoId/logros/:logroId` | Modifica un logro             |
| DELETE | `/proyectos/:proyectoId/logros/:logroId` | Elimina un logro              |

### GET `/proyectos/:proyectoId/logros`

**Respuesta 200:** array de logros (misma forma que la respuesta del `POST`).

**Errores:**

| Status | code          | Cuándo                           |
| ------ | ------------- | -------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id |

### POST `/proyectos/:proyectoId/logros`

**Body:**

| Campo             | Tipo   | Requerido | Notas                                  |
| ----------------- | ------ | --------- | -------------------------------------- |
| `descripcion`     | string | sí        | no puede estar vacío                   |
| `porcentaje`      | number | sí        | mayor que 0 y menor o igual a 100      |
| `urlCodigoFuente` | string | sí        | URL válida del código fuente (público) |

**Respuesta 201:**

```json
{
  "_id": "6acfd66a64d02459ba8dc6a9",
  "descripcion": "MVP publicado",
  "porcentaje": 60,
  "urlCodigoFuente": "https://github.com/fundacion/web",
  "createdAt": "2026-10-14T19:22:18.292Z",
  "updatedAt": "2026-10-14T19:22:18.292Z"
}
```

**Errores:**

| Status | code          | Cuándo                                                    |
| ------ | ------------- | --------------------------------------------------------- |
| 400    | `ERR-VAL-901` | Falta `descripcion`, está vacía o no es texto             |
| 400    | `ERR-VAL-902` | Falta `porcentaje`, no es número o está fuera de (0, 100] |
| 400    | `ERR-VAL-903` | Falta `urlCodigoFuente` o no es una URL válida            |
| 400    | `ERR-EST-109` | El proyecto está finalizado                               |
| 400    | `ERR-EST-113` | Con este logro, el total del proyecto superaría 100%      |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id                          |

### GET `/proyectos/:proyectoId/logros/:logroId`

**Respuesta 200:** el logro.

**Errores:**

| Status | code          | Cuándo                                   |
| ------ | ------------- | ---------------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id         |
| 404    | `ERR-NOT-114` | El proyecto no tiene un logro con ese id |

### PATCH `/proyectos/:proyectoId/logros/:logroId`

Modificación parcial: se manda solo lo que cambia. Los campos que vienen se validan igual que en el alta.

```json
{ "porcentaje": 70 }
```

Para el tope de 100% se cuenta el porcentaje **nuevo** del logro en lugar del anterior. Por ejemplo, con logros de 50% y 30%, el segundo se puede llevar a 50%, pero no a 51%.

**Respuesta 200:** el logro actualizado.

**Errores:**

| Status | code          | Cuándo                                              |
| ------ | ------------- | --------------------------------------------------- |
| 400    | `ERR-VAL-901` | `descripcion` vacía o no es texto                   |
| 400    | `ERR-VAL-902` | `porcentaje` no es número o está fuera de (0, 100]  |
| 400    | `ERR-VAL-903` | `urlCodigoFuente` no es una URL válida              |
| 400    | `ERR-EST-109` | El proyecto está finalizado                         |
| 400    | `ERR-EST-113` | Con el cambio, el total del proyecto superaría 100% |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id                    |
| 404    | `ERR-NOT-114` | El proyecto no tiene un logro con ese id            |

### DELETE `/proyectos/:proyectoId/logros/:logroId`

**Respuesta 200:** el logro eliminado.

**Errores:**

| Status | code          | Cuándo                                   |
| ------ | ------------- | ---------------------------------------- |
| 400    | `ERR-EST-109` | El proyecto está finalizado              |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id         |
| 404    | `ERR-NOT-114` | El proyecto no tiene un logro con ese id |

---

## Colaboraciones

| Método | Path                  | Descripción                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/colaboraciones`     | Lista todas las colaboraciones               |
| GET    | `/colaboraciones/:id` | Obtiene una colaboración por id              |
| POST   | `/colaboraciones`     | Anota una persona colaboradora a un proyecto |

### GET `/colaboraciones`

**Respuesta 200:** array de colaboraciones con la persona y el proyecto completos.

```json
[
  {
    "_id": "6acfd66a64d02459ba8dc6a7",
    "personaColaboradora": null,
    "proyecto": {
      "_id": "6acfd66264d02459ba8dc6a2",
      "titulo": "Sitio web institucional",
      "...": "..."
    },
    "anonima": true,
    "createdAt": "2026-10-14T19:22:18.224Z",
    "updatedAt": "2026-10-14T19:22:18.224Z",
    "__v": 0
  }
]
```

**Contribuciones anónimas:** si `anonima` es `true`, la colaboración figura igual, pero `personaColaboradora` es `null`. Si no es anónima, la persona aparece sin sus medios de contacto.

### GET `/colaboraciones/:id`

**Respuesta 200:** objeto colaboración (igual forma que arriba)

**Errores:**

| Status | code          | Cuándo                                |
| ------ | ------------- | ------------------------------------- |
| 404    | `ERR-NOT-506` | No existe una colaboración con ese id |

### POST `/colaboraciones`

**Body:**

| Campo                   | Tipo    | Requerido | Notas                                                       |
| ----------------------- | ------- | --------- | ----------------------------------------------------------- |
| `personaColaboradoraId` | string  | sí        | id de la persona colaboradora                               |
| `proyectoId`            | string  | sí        | id del proyecto                                             |
| `anonima`               | boolean | no        | si es `true`, no se muestra quién colaboró. Default `false` |

**Reglas de negocio:**

- El proyecto no puede estar finalizado.
- La persona debe tener al menos una de las **habilidades requeridas** de algún perfil del proyecto (las opcionales no cuentan).

**Respuesta 201:** la colaboración creada, con `id`, la persona (sin contactos) y el proyecto completos.

**Errores:**

| Status | code          | Cuándo                                                          |
| ------ | ------------- | --------------------------------------------------------------- |
| 400    | `ERR-VAL-501` | Falta `personaColaboradoraId`                                   |
| 400    | `ERR-VAL-502` | Falta `proyectoId`                                              |
| 400    | `ERR-VAL-504` | `anonima` no es booleano                                        |
| 400    | `ERR-VAL-503` | La persona no tiene ninguna habilidad requerida por el proyecto |
| 404    | `ERR-NOT-405` | No existe la persona colaboradora                               |
| 404    | `ERR-NOT-108` | No existe el proyecto                                           |
| 409    | `ERR-EST-505` | El proyecto está finalizado                                     |

---

## Búsquedas

| Método | Path                                                              | Descripción                                                   |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes` | Colaboradoras que encajan con un perfil                       |
| GET    | `/colaboradoras/:id/proyectos-acordes`                            | Proyectos que encajan con las habilidades de una colaboradora |

### GET `/proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes`

Devuelve las personas colaboradoras que tienen al menos una de las **habilidades requeridas** del perfil.

**Respuesta 200:** array de personas colaboradoras (misma forma que `GET /colaboradoras`, sin contactos)

**Errores:**

| Status | code          | Cuándo                                    |
| ------ | ------------- | ----------------------------------------- |
| 404    | `ERR-NOT-108` | No existe un proyecto con ese id          |
| 404    | `ERR-NOT-611` | El proyecto no tiene un perfil con ese id |

### GET `/colaboradoras/:id/proyectos-acordes`

Devuelve los proyectos **no finalizados** que tienen al menos un perfil que requiere alguna de las habilidades de la colaboradora.

**Respuesta 200:** array de proyectos (misma forma que `GET /proyectos`)

**Errores:**

| Status | code          | Cuándo                                        |
| ------ | ------------- | --------------------------------------------- |
| 404    | `ERR-NOT-405` | No existe una persona colaboradora con ese id |

---

## Mensajes

| Método | Path                                             | Descripción                                    |
| ------ | ------------------------------------------------ | ---------------------------------------------- |
| POST   | `/colectivos/:colectivoId/mensajes`              | Un colectivo envía un mensaje interno          |
| GET    | `/colaboradoras/:personaColaboradoraId/mensajes` | Bandeja de entrada de una persona colaboradora |

### POST `/colectivos/:colectivoId/mensajes`

Guarda el mensaje en la bandeja de la persona y lo **replica por email** a los contactos de tipo `email` que tenga registrados. Si el envío del mail falla, el mensaje interno se guarda igual. Los contactos `sms` y `whatsapp` todavía no envían nada real.

**Body:**

| Campo                   | Tipo   | Requerido | Notas                 |
| ----------------------- | ------ | --------- | --------------------- |
| `personaColaboradoraId` | string | sí        | id de la destinataria |
| `texto`                 | string | sí        | no puede estar vacío  |

**Respuesta 201:**

```json
{
  "id": "6acfd66a64d02459ba8dc6a8",
  "personaColaboradora": "devSolidario",
  "texto": "¡Hola! Tu perfil encaja con nuestro proyecto.",
  "date": "2026-10-14T19:22:18.253Z"
}
```

`personaColaboradora` es el nombre de fantasía de la destinataria.

**Errores:**

| Status | code          | Cuándo                                          |
| ------ | ------------- | ----------------------------------------------- |
| 400    | `ERR-VAL-802` | Falta `personaColaboradoraId`                   |
| 400    | `ERR-VAL-803` | Falta `texto` o está vacío                      |
| 400    | `ERR-VAL-804` | `texto` no es de tipo string                    |
| 403    | `ERR-EST-801` | La persona tiene `bloquearMensajeInterno: true` |
| 404    | `ERR-NOT-305` | No existe el colectivo                          |
| 404    | `ERR-NOT-405` | No existe la persona colaboradora               |

### GET `/colaboradoras/:personaColaboradoraId/mensajes`

**Respuesta 200:** mensajes recibidos, del más viejo al más nuevo.

```json
[
  {
    "id": "6acfd66a64d02459ba8dc6a8",
    "colectivo": "Fundación Ejemplo",
    "texto": "¡Hola! Tu perfil encaja con nuestro proyecto.",
    "date": "2026-10-14T19:22:18.253Z"
  }
]
```

`colectivo` es el nombre del colectivo que envió el mensaje.

**Errores:**

| Status | code          | Cuándo                                        |
| ------ | ------------- | --------------------------------------------- |
| 404    | `ERR-NOT-405` | No existe una persona colaboradora con ese id |

---

## Enums de referencia

| Enum                    | Valores                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `TipoColectivo`         | `fundacion`, `ong`, `asociacion barrial`, `asamblea`               |
| `Ubicacion`             | `argentina`, `caba` y las 23 provincias en minúsculas y sin tildes |
| `TipoCompromiso`        | `total`, `semanal`, `mensual`                                      |
| `ModalidadColaboracion` | `gratuita`, `incentivo_economico`, `contratacion_eventual`         |
| `TipoMedioDeContacto`   | `email`, `whatsapp`, `sms`                                         |
