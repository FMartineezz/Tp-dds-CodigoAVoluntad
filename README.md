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
   ├─── index.js
   ├─── package.json
   ├─── config               # Conexión a MongoDB
   │
   ├───src
   │   ├─── container.js     # Arma el grafo de dependencias (repositorios → services → controllers)
   │   ├─── controllers      # Encargados de la response a las request
   │   ├─── errors           # Catálogo de errores y AppError
   │   ├─── middlewares      # Validaciones (zod) y manejo de errores
   │   ├─── models           # Entidades de dominio anemicas
   │   ├─── repositories     # Encargados de la persistencia y acceso a datos
   │   ├─── routes           # Definicion de los endpoints
   │   ├─── schemas          # Schemas de Mongoose
   │   └─── services         # Encargados del comportamiento del dominio, contiene la logica y reglas de negocio
   │
   └───test
       ├─── fakes            # Repositorios en memoria que reemplazan a Mongo en los tests
       ├─── helpers          # Arma los services con los fakes, igual que container.js
       ├─── errors
       ├─── models           # Tests de la capa de dominio
       └─── services         # Tests de la capa de servicios
```

### Cómo levantar el backend

1. Instalar dependencias desde la raíz del repo: `npm install`
2. Levantar MongoDB, por ejemplo con Docker: `docker run -d --name mongo-cav -p 27017:27017 mongo:7`
3. Copiar `packages/backend/.env.example` a `packages/backend/.env` y completar:
   - `MONGODB_URI=mongodb://localhost:27017`
   - `MONGODB_DB_NAME=codigoavoluntad`
   - `SMTP_*` solo hace falta para probar el envío de mails (por ejemplo, con una cuenta de [ethereal.email](https://ethereal.email))
4. Cargar los datos iniciales: `npm run seed:backend` (**borra** lo que haya en las colecciones de la base del `.env` y vuelve a cargar habilidades, colectivos, colaboradoras, proyectos con perfiles y logros, colaboraciones y mensajes)
5. `npm run dev:backend`
6. La API queda en `http://localhost:8000` (el `SERVER_PORT` del `.env`) y la documentación Swagger en `/api-docs`.

Para probar la API a mano está la colección de Postman en `docs/CodigoAVoluntad.postman_collection.json`. Las carpetas están en orden: si se corre entera, cada alta guarda su id en una variable de la colección y los requests siguientes lo usan.

### Tests

Los tests unitarios usan [Jest](https://jestjs.io/) y cubren la capa de servicios y la de dominio. No necesitan MongoDB: los repositorios se reemplazan por fakes en memoria.

```bash
npm run test:backend                              # desde la raíz
npm test --workspace=backend -- logroService      # solo los tests de un archivo
npm run test:coverage --workspace=backend         # con reporte de cobertura
```

Como el backend usa ES Modules, Jest se ejecuta con `node --experimental-vm-modules`. Por eso aparece un `ExperimentalWarning` al correrlos; es esperable.

### Frontend

El frontend es la capa de interacción con el usuario. Se encarga de presentar la información, facilitar la navegación y permitir la ejecución de las acciones del sistema a través de una interfaz web intuitiva

```


```
