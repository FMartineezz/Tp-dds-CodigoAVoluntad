# API — Código a Voluntad

Documentación de los endpoints implementados en `packages/backend`.

## Info general

- **Base URL:** `http://localhost:{SERVER_PORT}` (por defecto `3000` si no se define `SERVER_PORT` en el `.env`)
- **Formato:** todos los bodies de request/response son `application/json`
- **Formato de error estándar:**
  ```json
  {
    "code": "ERR-XXX-000",
    "message": "Descripción del error"
  }
  ```
  Los códigos salen de `errorCatalog.js`. Si ocurre un error no controlado, se devuelve `500` con `code: "ERR-CSR-500"`.

- **Recursos implementados hoy:** Colectivos, Proyectos, Habilidades, Colaboradoras.
---

## Colectivos

| Método | Path | Descripción |
|---|---|---|
| GET | `/colectivos` | Lista todos los colectivos |
| GET | `/colectivos/:id` | Obtiene un colectivo por id |
| POST | `/colectivos` | Crea un colectivo |

### GET `/colectivos`

**Ejemplo de Respuesta 200:**
```json
[
  {
    "id": 1,
    "nombre": "Fundación Ejemplo",
    "descripcion": "Texto breve que describe a Fundación Ejemplo",
    "ubicacion": "caba",
    "tipoDeColectivo": "fundacion",
    "proyectos": []
  }
]
```

### GET `/colectivos/:id`

**Params:** 
- `id` (numérico)

**Respuesta 200:** objeto colectivo (igual forma que arriba)

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 404 | `ERR-CSR-305` | No existe un colectivo con ese id |

### POST `/colectivos`

**Body:**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `nombre` | string | sí | debe ser único |
| `descripcion` | string | sí | |
| `ubicacion` | string | no | validación de valores permitidos está **comentada** en el código, hoy no se valida |
| `tipoDeColectivo` | string (enum) | sí | uno de: `fundacion`, `ong`, `asociacion barrial`, `asambleas` |

**Respuesta 201:** objeto colectivo creado (con `id` asignado)

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-VAL-301` | Falta `nombre` |
| 400 | `ERR-VAL-302` | Falta `descripcion` |
| 400 | `ERR-VAL-304` | Falta `tipoDeColectivo` |
| 400 | `ERR-VAL-307` | `tipoDeColectivo` no es uno de los valores válidos |
| 400 | `ERR-VAL-001` | `nombre`, `descripcion` o `tipoDeColectivo` no son de tipo string |

---

## Proyectos

| Método | Path | Descripción |
|---|---|---|
| GET | `/proyectos` | Lista todos los proyectos |
| GET | `/proyectos/:id` | Obtiene un proyecto por id |
| POST | `/proyectos` | Crea un proyecto |
| PATCH | `/proyectos/:id/finalizar` | Marca un proyecto como finalizado |

### GET `/proyectos`

**Respuesta 200:**
```json
[
  {
    "id": 1,
    "titulo": "Sitio web institucional",
    "descripcion": "...",
    "habilidadesRequeridas": [ { "id": 1, "titulo": "React", "codigo": "react", "descripcion": "..." } ],
    "horas": 10,
    "tipoDeCompromiso": "semanal",
    "modalidadDeColaboracion": "gratuita",
    "colectivo": { "id": 1, "nombre": "Fundación Ejemplo", "...": "..." },
    "finalizado": false
  }
]
```

### GET `/proyectos/:id`

**Params:** `id` (numérico)

**Respuesta 200:** objeto proyecto (igual forma que arriba)

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 404 | `ERR-CSR-108` | No existe un proyecto con ese id |

### POST `/proyectos`

**Body:**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `titulo` | string | sí | único junto con `colectivo` |
| `descripcion` | string | sí | |
| `habilidadesRequeridas` | string[] | sí | array de **códigos** de habilidad ya existentes (no títulos) |
| `horas` | number | sí | |
| `tipoDeCompromiso` | string (enum) | sí | uno de: `total`, `semanal`, `mensual` |
| `modalidadDeColaboracion` | string (enum) | sí | uno de: `gratuita`, `incentivo_economico`, `contratacion_eventual` |
| `colectivo` | string | sí | **nombre** del colectivo existente (no id, no objeto) |

**Respuesta 201:** objeto proyecto creado

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-VAL-101` | Falta `titulo` |
| 400 | `ERR-VAL-102` | Falta `descripcion` |
| 400 | `ERR-VAL-103` | Falta `habilidadesRequeridas` |
| 400 | `ERR-VAL-111` | `habilidadesRequeridas` no es array de strings |
| 400 | `ERR-VAL-104` | Falta `horas` |
| 400 | `ERR-VAL-105` | Falta `tipoDeCompromiso` |
| 400 | `ERR-VAL-106` | Falta `modalidadDeColaboracion` |
| 400 | `ERR-VAL-107` | Falta `colectivo` |
| 400 | `ERR-VAL-112` | `colectivo` vino como objeto en vez de string (nombre) |
| 409 | `ERR-CSR-110` | Ya existe un proyecto con ese título para ese colectivo |
| 404 | `ERR-CSR-205` | Alguno de los códigos en `habilidadesRequeridas` no existe |
| 404 | `ERR-CSR-306` | El `colectivo` (nombre) no existe |

### PATCH `/proyectos/:id/finalizar`

**Params:** `id` (numérico) · **Body:** no lleva body

**Respuesta 200:** objeto proyecto con `finalizado: true`

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 404 | `ERR-CSR-108` | No existe un proyecto con ese id |

---

## Habilidades

| Método | Path | Descripción |
|---|---|---|
| GET | `/habilidades` | Lista todas las habilidades |
| GET | `/habilidades/:id` | Obtiene una habilidad por id |
| POST | `/habilidades` | Crea una habilidad |

### GET `/habilidades`

**Respuesta 200:**
```json
[
  { "id": 1, "titulo": "React", "codigo": "react", "descripcion": "..." }
]
```

### GET `/habilidades/:id`

**Params:** `id` (numérico)

**Respuesta 200:** objeto habilidad

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-VAL-001` | `:id` no es numérico |
| 404 | `ERR-CSR-204` | No existe una habilidad con ese id |

### POST `/habilidades`

**Body:**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `titulo` | string | sí | se normaliza automáticamente a `codigo` (minúsculas, sin espacios/puntuación, unido con `_`) |
| `descripcion` | string | sí | |

**Respuesta 201:** objeto habilidad creado (incluye `codigo` generado)

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-VAL-201` | Falta `titulo` |
| 400 | `ERR-VAL-202` | Falta `descripcion` |
| 400 | `ERR-VAL-001` | `titulo` o `descripcion` no son de tipo string |
| 409 | `ERR-CSR-206` | Ya existe una habilidad con el mismo `titulo` + `descripcion` |

---

## Colaboradoras

| Método | Path | Descripción |
|---|---|---|
| GET | `/colaboradoras` | Lista todas las personas colaboradoras |
| GET | `/colaboradoras/:id` | Obtiene una persona colaboradora por id |
| POST | `/colaboradoras` | Crea una persona colaboradora |

### GET `/colaboradoras`

**Respuesta 200:**
```json
[
  {
    "id": 1,
    "nombreFantasia": "devSolidario",
    "git": "https://github.com/devSolidario",
    "nombre": "Ana",
    "apellido": "Pérez",
    "habilidades": [ { "id": 1, "titulo": "React", "codigo": "react", "descripcion": "..." } ],
    "pronombres": "ella",
    "presentacion": "..."
  }
]
```

### GET `/colaboradoras/:id`

**Params:** `id` (numérico)

**Respuesta 200:** objeto persona colaboradora (igual forma que arriba)

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 404 | `ERR-CSR-405` | No existe una persona colaboradora con ese id |

### POST `/colaboradoras`

**Body:**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `nombreFantasia` | string | sí | |
| `git` | string | sí | |
| `nombre` | string | no | |
| `apellido` | string | no | |
| `habilidades` | string[] | sí | array de **códigos** de habilidad ya existentes (no títulos) |
| `pronombres` | string | no | no se valida ni se le pisa un default |
| `presentacion` | string | sí | |

**Respuesta 201:** objeto persona colaboradora creado

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-VAL-401` | Falta `nombreFantasia` |
| 400 | `ERR-VAL-402` | Falta `git` |
| 400 | `ERR-VAL-403` | Falta `habilidades` |
| 400 | `ERR-VAL-404` | Falta `presentacion` |
| 404 | `ERR-CSR-205` | Alguno de los códigos en `habilidades` no existe |

---

## Colaboraciones 🚧

**Estado:** en desarrollo, implementado en la [PR #13](https://github.com/FMartineezz/Tp-dds-CodigoAVoluntad/pull/13) (`feature/colaboracion`), **todavía no mergeada a `main`** — no disponible en producción todavía. Se documenta acá como referencia de lo que traerá, pero puede cambiar antes del merge.

| Método | Path | Descripción |
|---|---|---|
| GET | `/colaboraciones` | Lista todas las colaboraciones |
| GET | `/colaboraciones/:id` | Obtiene una colaboración por id |
| POST | `/colaboraciones` | Crea una colaboración entre una persona colaboradora y un proyecto |

### POST `/colaboraciones`

**Body:**

| Campo | Tipo | Requerido |
|---|---|---|
| `personaColaboradoraId` | number | sí |
| `proyectoId` | number | sí |

Reglas de negocio: el proyecto no puede estar finalizado, y la persona debe tener al menos una habilidad en común con las requeridas por el proyecto.

**Errores:**

| Status | code | Cuándo |
|---|---|---|
| 400 | `ERR-EST-504` | El proyecto ya está finalizado |
| 400 | `ERR-VAL-503` | La persona no tiene ninguna habilidad requerida por el proyecto |
| 404 | `ERR-NOT-505` | No existe la colaboración (en `GET /:id`) |

---

## Enums de referencia

| Enum | Valores |
|---|---|
| `TipoColectivo` | `fundacion`, `ong`, `asociacion barrial`, `asambleas` |
| `TipoCompromiso` | `total`, `semanal`, `mensual` |
| `ModalidadColaboracion` | `gratuita`, `incentivo_economico`, `contratacion_eventual` |

---

## Pendiente / fuera de alcance actual

- `Colaboracion` todavía no está disponible en `main` — ver sección "Colaboraciones 🚧" arriba (PR #13, abierta).
- Sin `PUT`/`DELETE` para ningún recurso.
- Sin paginación en los listados (`GET /colectivos`, `/proyectos`, `/habilidades`, `/colaboradoras` devuelven el array completo).
