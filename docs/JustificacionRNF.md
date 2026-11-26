# Justificación de los requerimientos no funcionales (Entrega 3) — PROPUESTA
Rutas relativas a `packages/frontend/src/`.


## 1. Interfaz intuitiva

**Requerimiento:** navegación coherente; las funciones principales a pocos clics.

- **Menú según quién entra** (`plantillas/menus.js`): tres menús de 3 o 4 ítems (visitante, colaboradora y organización). Cada caso de uso principal queda a **1 clic** desde el menú y a **2 como máximo** desde el panel: por ejemplo, Panel → Mis proyectos → Postulaciones.
- **Panel como punto de partida**: `PanelCol` y `PanelOrg` muestran lo pendiente (postulaciones, mensajes sin leer, proyectos sugeridos) con enlaces directos a cada acción.
- **Migas de pan** (`moleculas/Crumbs`) en las pantallas que no están en el menú (editar proyecto, postulaciones y equipo de un proyecto), para saber dónde estás y volver.
- **Rutas protegidas por rol** (`contexto/Auth.js` → `<Privada>`): si se entra sin sesión, se va a *Ingresar* y después se vuelve a la página pedida (`?volver=`). Si el rol no corresponde, se muestra *Sin permiso*, nunca una pantalla rota.
- **Páginas de error propias** (`paginas/sistema/Errores.js`): 404 y 403 con un texto claro y un botón para volver.

## 2. Aprendizaje rápido (patrones conocidos)

**Requerimiento:** seguir patrones de e-commerce y guiar con textos.

| Patrón de e-commerce | En la plataforma |
|---|---|
| Catálogo de productos en tarjetas | Listado de proyectos con `ProyectoCard` (título, colectivo, habilidades, modalidad y avance) |
| Ficha de producto | `DetalleProyecto`: atributos, perfiles con cupo, equipo, avance, logros y enlaces |
| «Agregar al carrito» | «Postularme» en cada perfil, con diálogo de confirmación |
| Mis pedidos (estados) | `PostulacionesCol` con pestañas Pendientes / Aceptadas / Rechazadas y etiquetas de estado (`StatusBadge`) |
| Paginador | `moleculas/Pager` en todos los listados (paginación del servidor) |
| Badge del carrito | Contador de mensajes sin leer en el menú y en la campana |

- **Textos que guían**: cada campo de formulario tiene ayuda (`Field` → `hint`) y *Cómo funciona* explica el recorrido de cada rol con preguntas frecuentes.
- **Estados vacíos con próximo paso**: por ejemplo, «Todavía no hay proyectos abiertos que pidan tus habilidades», en lugar de una tabla vacía.

## 3. Feedback visual y notificaciones

**Requerimiento:** mensajes de error y de confirmación en cada interacción, e indicadores de carga.

- **Carga**: `hooks/usePedido.js` expone `cargando` en todas las pantallas conectadas. Mientras tanto se muestran esqueletos (`moleculas/Skeletons`: `RowsSkeleton` y `CardsSkeleton`) en **19 pantallas**. Los esqueletos anuncian «Cargando…» a lectores de pantalla (`role="status"`).
- **Botones en espera**: `Button loading` deshabilita el botón, muestra el spinner y pone `aria-busy="true"`. Así se evitan los dobles envíos. Lo cubre `atomos/atomos.test.js`.
- **Confirmación y error**: `moleculas/Alert` en **23 pantallas**. Usa verde para éxito y rojo para error; los errores llevan `role="alert"` (se anuncian solos) y el resto `role="status"`.
- **Errores del backend con su mensaje**: `api/errores.js → mensajeDeError` muestra el `message` del catálogo de errores del backend (por ejemplo, «El perfil ya alcanzó su límite de colaboraciones»). Si el backend no responde, dice «No pudimos conectarnos con el servidor». Lo verifica `paginas/organizacion/PostulacionesOrg.test.js`.
- **Acciones permanentes** (lo pide el enunciado para desanotar): `ConfirmDialog` en **5 pantallas** (dar de baja a una colaboración desde los dos lados, rechazar una postulación, finalizar un proyecto y eliminar la cuenta). Para eliminar la cuenta hay que escribir el nombre del colectivo.
- **Validación de formularios** (`paginas/acceso/auxiliares.js`): los errores se muestran al salir del campo y, al enviar, aparece un resumen arriba con todos los errores juntos.

## 4. Diseño responsivo

**Requerimiento:** funcional en desktop, tablet y celular.

- **Puntos de corte**: el principal es `800px` (14 reglas), con ajustes en 600, 860 y 980 px.
- **Navegación en el celular**: el menú pasa a una **barra inferior con íconos** (`ICONOS` y `ETIQUETA_MOVIL` en `menus.js`), al alcance del pulgar.
- **Tablas que se apilan**: debajo de 800 px cada fila se convierte en una tarjeta, y cada celda muestra su título con `td::before { content: attr(data-l) }` (`plantillas/disposicion.module.css`). Así no hace falta scroll horizontal.
- **Grillas fluidas** (`moleculas/Grid`) con `auto-fill` y `minmax`: la cantidad de columnas se adapta sola.

## 5. Accesibilidad

**Requerimiento:** buen contraste, etiquetas ARIA, navegación por teclado y botones grandes.

- **Contraste** (WCAG 2.1 AA pide 4,5:1 para texto normal). Medido sobre el fondo (`paper-200`):

  | Uso | Color | Contraste |
  |---|---|---|
  | Texto principal | `ink-900` | **15,2:1** (AAA) |
  | Texto de apoyo | `ink-700` | **6,1:1** |
  | Enlaces y foco | `blue-600` | **5,5:1** |
  | Errores y peligro | `red-700` | **5,2:1** |
  | Éxito | `green-700` | **5,9:1** |
  | Texto sobre etiquetas (`sand-400`) | `ink-900` | **10,2:1** |

  El rojo claro `red-500` (3:1) se usa solo como decoración y está marcado así en `estilos/paleta.css`.
- **Teclado**: enlace «Saltar al contenido» (`plantillas/LayoutPrincipal.js`) y un aro de foco visible de 3 px (`:focus-visible` en `estilos/base.css`). Las pestañas se mueven con las flechas (`moleculas/Tabs`) y los diálogos usan `<dialog>` nativo, que encierra el foco y se cierra con Esc.
- **ARIA**: más de 100 atributos. Por ejemplo, `aria-current` en el menú, `aria-invalid` y `aria-describedby` en los campos con error (`Field`, verificado en `atomos.test.js`), `aria-expanded` y `aria-controls` en los desplegables, `aria-selected` en las pestañas, y `aria-hidden` en los íconos decorativos.
- **Tamaño táctil**: `--tap-target: 3rem` (48 px, mayor que los 44 px recomendados) como alto mínimo de botones y campos (`estilos/espaciado-y-forma.css`).
- **Movimiento reducido**: 6 reglas `prefers-reduced-motion` desactivan las animaciones (marquesina, tickets inclinados).
- **Modo daltónico** (requerimiento opcional elegido): `estilos/temas/daltonico.css`. Reemplaza el par rojo/verde por una paleta distinguible y se recuerda entre visitas.
- **Idioma**: `<html lang="es">`, para que los lectores de pantalla pronuncien bien.

## 6. Consistencia en la UI

**Requerimiento:** estilos, colores y tipografías homogéneos; componentes reutilizables coherentes.

- **Una única fuente de verdad visual** (`estilos/`):
  - `paleta.css` tiene los colores (hex) y es el único lugar donde aparecen.
  - `colores-semanticos.css` define los roles: `--color-text`, `--color-danger`…
  - `titulos.css` tiene la escala de h1 a h6.
  - `espaciado-y-forma.css` define espaciado, radios y sombras.

  Los componentes usan variables, no colores sueltos.
- **Dos tipografías** en todo el sitio: Archivo para texto y títulos, IBM Plex Mono para datos (fechas, códigos). Se sirven desde el propio bundle con `@fontsource`, sin pedidos a Google.
- **Un solo componente por función**: hay un `Button` para todo el sitio (con variantes), un `Field` para todos los campos, un `Alert` para todos los avisos y un `ConfirmDialog` para todas las confirmaciones.
- **Documentación para el equipo**: cada carpeta tiene un `LEEME.md`, y además están `docs/GLOSARIO.md` y `docs/RECETAS.md`, para que cualquiera agregue pantallas sin romper la consistencia.
