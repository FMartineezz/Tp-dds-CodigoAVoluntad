# Plantillas · Código a Voluntad

Prototipo de alta fidelidad del front (26 pantallas) **escrito para leerlo y reutilizarlo**: cada pieza está en
su carpeta, comentada y con indicaciones de cómo extenderla. La idea es usarlo como guía para rearmar o ampliar el sitio a mano.

Estética: «serigrafía de barrio» (papel crema, tintas planas, títulos condensados, esquinas redondeadas, sombra de impresión).
Los datos son de prueba (`src/datos`) y la sesión es simulada: no hay backend.

## Cómo verlo

```bash
cd packages/frontend/Plantillas
npm install
npm run dev        # http://localhost:5173
npm test           # tests de los átomos
```

Para entrar con sesión (en `/ingresar`):

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
├─ hooks/         ← lógica reutilizable (useLoading, useDisclosure)
├─ contexto/      ← sesión (Auth) y modo daltónico
├─ datos/         ← datos de prueba
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

Más recetas (nueva columna de tabla, nuevo botón en la navbar, nuevo campo, nueva pantalla…): **`docs/RECETAS.md`**.

**¿Primera vez con React?** Leé primero **`docs/GLOSARIO.md`**: explica con ejemplos del propio proyecto qué es un componente, props, estado,
`map`, `filter`, `&&`, etc. Las pantallas (`src/paginas/`) están escritas para leerse de arriba hacia abajo:
cada una tiene un bloque *ANATOMÍA DE ESTE ARCHIVO* y cuatro secciones con el mismo orden
(1 datos y estado · 2 cálculos · 3 acciones · 4 lo que se dibuja), con un comentario en cada parte.

## Llevarlo al proyecto real (Create React App)

1. Copiá el contenido de `src/` dentro de `packages/frontend/src/` (o dejá la carpeta `Plantillas` como referencia y copiá por piezas).
2. Renombrá `main.js` a `index.js` (la entrada de CRA). Se llama `index.js` y debe cargar las fuentes y `./estilos/index.css`.
3. Instalá las dependencias: `npm install react-router-dom @fontsource-variable/archivo @fontsource/ibm-plex-mono --workspace=frontend` (y `axios`).
4. Los tests: en CRA se usa `jest.fn()` (acá `vi.fn()`) y no hace falta importar `describe/test`.
5. Reemplazá `src/datos` y `useLoading` por llamadas a la API con Axios; reemplazá `contexto/Auth.js` por el login real.

> `vite.config.js`, `index.html` y `package.json` de esta carpeta existen solo para poder correr las plantillas por separado.

## Lo que es simulado (y hay que conectar)

- Sesión y roles (`contexto/Auth.js`) · datos (`datos/`) · esperas de carga (`hooks/useLoading.js`).
- hCaptcha (`moleculas/CaptchaMock`) y login social (`moleculas/SocialButtons`).
- Los íconos son provisorios (`atomos/Icon`): se reemplazan por la biblioteca que se elija, tocando solo ese archivo.
