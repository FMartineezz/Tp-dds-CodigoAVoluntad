# TP Desarrollo De Software "Código a Voluntad"

## Contexto del Proyecto

**Código a Voluntad** es una plataforma open-source que tiene como finalidad funcionar como un puente solidario y tecnológico entre dos actores clave:

- **Organizaciones con impacto social:** ONGs, fundaciones, asambleas y espacios territoriales que necesitan software de nivel profesional, pero carecen del presupuesto para costearlo.
- **Personas colaboradoras:** Desarrolladores y especialistas IT que buscan aportar su experiencia, mano de obra y asesoramiento de forma voluntaria.

### Arquitectura Tecnológica

El sistema se apoya en una arquitectura web cliente-servidor (cliente pesado), utilizando el siguiente stack tecnológico:

- **Backend:** Node.js y Express
- **Frontend:** React

## Metodologia de trabajo

El proyecto se desarrolla siguiendo el enfoque **GithubFlow**, para mantener un flujo organizado y mejorar la coordinacion entre los colaboradores

## Estructura del Proyecto

### Backend

El backend es la capa responsable de la lógica de negocio, la validación de datos, la seguridad y la persistencia. Expone APIs que permiten la comunicación con el frontend y centraliza la lógica del sistema

```
───backend
   ├─── index.js             # Levanta la app (buildApp) y la conexión a MongoDB
   ├─── jsconfig.json        # Chequeo de tipos de las anotaciones JSDoc (npm run types)
   ├─── package.json
   ├─── config               # Conexión a MongoDB
   │
   ├───src
   │   ├─── app.js           # buildApp(routes): Express con json, cors, rutas, 404 y manejo de errores
   │   ├─── container.js     # Arma el grafo de dependencias (repositorios → services → controllers)
   │   ├─── controllers      # Encargados de la response a las request
   │   ├─── errors           # Catálogo de errores y AppError
   │   ├─── middlewares      # Validaciones (zod) y manejo de errores
   │   ├─── models           # Entidades de dominio anemicas
   │   ├─── repositories     # Encargados de la persistencia y acceso a datos
   │   ├─── routes           # Definicion de los endpoints
   │   ├─── schemas          # Schemas de Mongoose
   │   ├─── services         # Encargados del comportamiento del dominio, contiene la logica y reglas de negocio
   │   └─── types.js         # Tipos compartidos en JSDoc (Id, Paginacion, ProyectoGuardado…)
   │
   └───test
       ├─── setup            # Levanta un MongoDB en memoria para toda la suite (mongodb-memory-server)
       ├─── unit             # Capa de dominio (models) y errores, sin base de datos
       ├─── services         # Capa de servicios, con sus repositorios reales contra la base en memoria
       ├─── validations      # Schemas de zod
       ├─── int              # Integración con Supertest: rutas → controllers → services → repositorios
       │   └─── utils        # app: la misma app que levanta index.js
       ├─── seeds            # Verifica que los seeds respeten las reglas del dominio
       └─── utils            # Base por archivo de test, escenarios, esperarAppError y consultasA
```

### Cómo levantar el backend

1. Instalar dependencias desde la raíz del repo: `npm install`
2. Levantar MongoDB, por ejemplo con Docker: `docker run -d --name mongo-cav -p 27017:27017 mongo:7`
3. Copiar `packages/backend/.env.example` a `packages/backend/.env` y completar:
   - `MONGODB_URI=mongodb://localhost:27017`
   - `MONGODB_DB_NAME=codigoavoluntad`
   - `SMTP_*` solo hace falta para probar el envío de mails (por ejemplo, con una cuenta de [ethereal.email](https://ethereal.email))
4. Cargar los datos iniciales (**borra** lo que haya en las colecciones de la base del `.env`):
   - `npm run seed:backend`: demo curada. Pocas entidades con nombres reconocibles que pasan por todos los estados (búsqueda abierta, con fecha, vencida o cerrada; proyectos finalizados a mano y por cierre automático; perfiles sin cupo, con lugar y llenos; postulaciones pendientes, aceptadas, rechazadas y anónimas; bajas hechas por la persona y por el colectivo; denuncias en sus 4 estados; un colectivo dado de baja y una cuenta anonimizada). Datos en `packages/backend/seeds/datos.js`.
   - `npm run seed:backend:volumen`: la demo más unos 40 colectivos, 150 colaboradoras y 60 proyectos generados, para ver paginación y búsquedas con muchos resultados. Se ajusta con `npm run seed:backend:volumen -- --proyectos=150 --semilla=7`; con la misma semilla genera siempre los mismos datos. Generador en `packages/backend/seeds/volumen.js`.
   - El test `test/seeds/seed.test.js` verifica que ambos modos respeten las reglas del dominio y cubran todos los estados.
5. `npm run dev:backend`
6. La API queda en `http://localhost:8000` (el `SERVER_PORT` del `.env`) y la documentación Swagger en `/api-docs`.

Para probar la API a mano está la colección de Postman en `docs/CodigoAVoluntad.postman_collection.json`. Las carpetas están en orden: si se corre entera, cada alta guarda su id en una variable de la colección y los requests siguientes lo usan.

### Tests

Los tests usan [Jest](https://jestjs.io/) y **un MongoDB en memoria** ([mongodb-memory-server](https://www.npmjs.com/package/mongodb-memory-server)): no hace falta tener Mongo instalado ni levantado. `test/setup/globalSetup.js` arranca un `mongod` real una sola vez, y cada archivo de test usa su propia base dentro de él (`test/utils/db.js`), que se vacía después de cada test. Así pueden correr en paralelo sin pisarse. La primera vez se descarga el binario de MongoDB.

No hay mocks de repositorios: lo que se prueba es lo mismo que corre en producción.

- **Unitarios** (`test/unit`): modelos de dominio y errores, sin base.
- **De servicios** (`test/services`): cada service con sus repositorios reales contra la base en memoria. Algunos además cuentan las consultas que llegan a la base (`consultasA` en `test/utils/db.js`) para asegurar que no haya consultas N+1.
- **De integración** (`test/int`): con [Supertest](https://www.npmjs.com/package/supertest) se le hacen requests HTTP a la app real (rutas, validaciones de zod, controllers, services, repositorios y `errorHandler`). El transporter de mails usa el modo JSON de nodemailer, que arma el mail sin enviarlo.

Cada test sigue la estructura preparación → ejecución → validación.

```bash
npm run test:backend                              # desde la raíz
npm run test:unit --workspace=backend             # unitarios, de services y de validaciones
npm run test:int --workspace=backend              # solo integración
npm test --workspace=backend -- logroService      # solo los tests de un archivo
npm run test:coverage --workspace=backend         # con reporte de cobertura
```

Como el backend usa ES Modules, Jest se ejecuta con `node --experimental-vm-modules`. Por eso aparece un `ExperimentalWarning` al correrlos; es esperable.

### Tipos con JSDoc

JavaScript no tiene tipos: los agregamos con anotaciones [JSDoc](https://jsdoc.app/) en models, services, repositorios y controllers. Los tipos compartidos están en `src/types.js`: `Id`, `Paginacion`, `Pagina<T>` y la versión guardada de cada modelo, como `ProyectoGuardado`. VS Code los usa para autocompletar y marcar errores mientras se escribe, y el chequeo se puede correr a mano:

```bash
npm run types --workspace=backend   # tsc --noEmit sobre src/ (no compila nada, solo verifica)
```

### Frontend

El frontend es la capa de interacción con el usuario. Se encarga de presentar la información, facilitar la navegación y permitir la ejecución de las acciones del sistema a través de una interfaz web intuitiva. Está hecho con React + Vite y Axios; la estructura de carpetas (átomos → moléculas → organismos → plantillas → páginas) está explicada en `packages/frontend/README.md`.

```bash
cp packages/frontend/.env.example packages/frontend/.env.local   # VITE_API_URL=http://localhost:8000
npm run start:frontend    # http://localhost:5173 (necesita el backend levantado)
npm run test:frontend     # tests del front (Vitest + Testing Library)
npm run build:frontend    # genera packages/frontend/dist
```

## Despliegue

Todo corre en un único servidor con `docker compose` (`docker-compose.yml`):

| Servicio | Qué hace |
|---|---|
| `nginx` | Único expuesto a internet (80/443). Sirve el front compilado, hace de proxy a la API en `/api/` y a Keycloak en `/auth/`, y termina HTTPS. Su imagen (`deploy/nginx/Dockerfile`) compila el front en un primer paso y copia el `dist`. |
| `certbot` | Renueva el certificado de Let's Encrypt. |
| `backend` | La API (Express), en la red interna. |
| `mongodb` | La base, con un usuario propio para la app (`deploy/mongo-init`). |
| `keycloak` + `keycloak-db` | Login (todavía no integrado con el front). |

Primer despliegue en el servidor:

```bash
./deploy/gen-env.sh            # crea .env con claves aleatorias; completar SMTP y DOMAIN
./deploy/init-letsencrypt.sh   # pide el certificado y levanta todo
```

Para actualizar después de un merge: `git pull && docker compose up -d --build`.

El front le habla a la API por `/api` (mismo dominio), así que no hace falta CORS. Las variables `VITE_*` se fijan al compilar: se cambian con `build.args` en el servicio `nginx`.
