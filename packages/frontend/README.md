# Frontend · Código a Voluntad

El front de la plataforma (26 pantallas, React + Vite + Axios) **escrito para leerlo y extenderlo**: cada pieza está en
su carpeta, comentada y con indicaciones de cómo extenderla.

Estética: «serigrafía de barrio» (papel crema, tintas planas, títulos condensados, esquinas redondeadas, sombra de impresión).
Todos los datos vienen del backend (`src/api/`). La sesión todavía es simulada, hasta integrar Keycloak.

## Cómo verlo

Necesita el backend levantado (ver el README de la raíz). Desde la raíz del repo:

```bash
npm install
cp packages/frontend/.env.example packages/frontend/.env.local   # VITE_API_URL=http://localhost:8000
npm run start:frontend    # http://localhost:5173
npm run test:frontend     # tests (átomos + integración de PostulacionesOrg)
```

Para entrar con sesión (en `/ingresar`). Las cuentas de demo son ids fijos que crea el seed del backend:

| Rol | Correo | Contraseña |
|---|---|---|
| Colaboradora | `colaboradora@demo.org` | `demo1234` |
| Organización | `organizacion@demo.org` | `demo1234` |

## Mapa de carpetas (de lo más chico a lo más grande)

```
src/
├─ estilos/       ← TODO el aspecto: paleta (hex), roles de color, títulos h1–h6, espaciado, temas
├─ atomos/        ← piezas mínimas e indivisibles: Button, Field, Tag, Heading, Icon…
├─ moleculas/     ← combinan átomos: Ticket, Alert, Tabs, TagPicker, ConfirmDialog…
├─ organismos/    ← bloques completos: Navbar, Footer, ProyectoCard, Dialogos…
├─ plantillas/    ← estructura de página: LayoutPrincipal, menus.js, disposicion.module.css
├─ paginas/       ← las 26 pantallas, agrupadas por área (publico, acceso, colaboradora, organizacion…)
├─ api/           ← cliente HTTP (Axios) y adaptadores: lo único que conoce los nombres del backend
├─ hooks/         ← lógica reutilizable (usePedido, useDisclosure)
├─ contexto/      ← sesión (Auth) y modo daltónico
├─ datos/         ← textos fijos (preguntas frecuentes, motivos de denuncia)
├─ utilidades/    ← funciones chicas (cx)
├─ App.js         ← mapa de rutas
└─ main.js        ← entrada (fuentes + estilos + render)
```

**Regla de dependencias** (para no enredarse): cada nivel solo usa los *anteriores* de esta lista (estilos → átomos → moléculas → organismos → plantillas → páginas).
Un átomo no conoce a las moléculas; una página puede usar todo. Así podés tocar un átomo con la certeza de
que solo afecta hacia abajo (a lo que lo usa), y nunca rompe hacia arriba.

Cada carpeta tiene un `LEEME.md` corto, y cada archivo empieza con un comentario que explica
**qué es, cómo se usa, qué implica cambiarlo o sacarlo y cómo agregarle hermanos**.

## Los tres archivos que más vas a tocar

| Querés cambiar… | Editá |
|---|---|
| Un color de todo el sitio | `src/estilos/paleta.css` (único lugar con hex) |
| El tamaño o aspecto de h1–h6 | `src/estilos/titulos.css` |
| Qué ítems tiene el menú | `src/plantillas/menus.js` |

Más recetas (nueva columna de tabla, nuevo botón en la navbar, nuevo campo, nueva pantalla…): **`packages/frontend/docs/RECETAS.md`**.

**¿Primera vez con React?** Leé primero **`packages/frontend/docs/GLOSARIO.md`**: explica con ejemplos del propio proyecto qué es un componente, props, estado,
`map`, `filter`, `&&`, etc. Las pantallas (`src/paginas/`) están escritas para leerse de arriba hacia abajo:
cada una tiene un bloque *ANATOMÍA DE ESTE ARCHIVO* y cuatro secciones con el mismo orden
(1 datos y estado · 2 cálculos · 3 acciones · 4 lo que se dibuja), con un comentario en cada parte.

## Cómo habla con el backend

- `src/api/cliente.js` es la única instancia de Axios (URL base de `VITE_API_URL`, timeout de 10 s). El token del login real se va a agregar ahí, con un interceptor.
- Cada `src/api/*.js` pide algo al backend y lo **adapta** a lo que muestra la pantalla. Si el backend cambia un nombre, se arregla solo ahí.
- Las pantallas piden datos con `usePedido` (`src/hooks/usePedido.js`): `cargando` muestra los esqueletos y `error` el aviso rojo con el mensaje del backend (`api/errores.js`).
- En producción el front se compila con `VITE_API_URL=/api` y lo sirve nginx (ver `deploy/nginx/Dockerfile` en la raíz).

## Lo que sigue simulado

- Sesión y roles (`contexto/Auth.js`): falta integrar Keycloak.
- hCaptcha (`moleculas/CaptchaMock`) y login social (`moleculas/SocialButtons`).
- Los íconos son provisorios (`atomos/Icon`): se reemplazan por la biblioteca que se elija, tocando solo ese archivo.
