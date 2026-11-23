# Recetas: cómo agregar y cambiar cosas

Cada receta indica **qué archivo tocar** y **qué pasa si lo hacés mal**. Ejemplos con código real del proyecto.

---

## Estilos universales

### Cambiar un color de todo el sitio
`src/estilos/paleta.css` → cambiá el hex.
```css
--blue-600: #3a54b4;   /* ← cambialo y cambian enlaces, avances y botón principal */
```
Verificá el contraste: texto normal ≥ 4,5:1.

### Cambiar qué color cumple un rol (sin tocar la paleta)
`src/estilos/colores-semanticos.css`
```css
--color-accent: var(--green-700);   /* ahora los acentos son verdes */
```

### Agregar un color nuevo
1. `paleta.css`: `--teal-600: #0f766e;`
2. (opcional) `colores-semanticos.css`: `--color-info: var(--teal-600);`
3. Usalo en un componente: `color: var(--color-info);` — **nunca** escribas el hex en el componente.

### Cambiar el tamaño de los títulos
`src/estilos/titulos.css`: una variable por nivel.
```css
--h2-size: clamp(2rem, 1.4rem + 2.6vw, 3.25rem);   /* mínimo, fluido, máximo */
```
Afecta a todos los `<h2>` y a todo `<Heading size="h2">`.

### Agregar otro nivel de título (h7)
1. `titulos.css`: variables `--h7-size/line/stretch`, sumá `h7, .h7` a las listas y una línea de regla.
2. `atomos/Heading/Heading.js`: agregá `'h7'` a `SIZES`.

### Agregar un tema (ej. modo oscuro)
Copiá `estilos/temas/daltonico.css` como `oscuro.css`, cambiá `[data-theme='oscuro']` y los hex que quieras,
importalo en `estilos/index.css` y activá el atributo con el mismo mecanismo de `contexto/Auth.js`.

---

## Navegación

### Agregar un ítem al menú (centro de la barra y barra inferior móvil)
`src/plantillas/menus.js` → una fila en el array del rol.
```js
org: [
  ['/org', 'Panel', true],
  ['/org/proyectos', 'Mis proyectos'],
  ['/org/estadisticas', 'Estadísticas'],     // ← NUEVO
  ...
],
```
Y en `ICONOS.org` agregá su ícono **en la misma posición**. Después creá la ruta (ver «Agregar una pantalla»).

### Agregar un botón a la derecha de la navbar
`src/plantillas/LayoutPrincipal.js` → dentro de `actions={…}`, en el grupo del rol que corresponda.
```jsx
<>
  <Campana />
  <Button as={Link} to="/ayuda" variant="secondary">Ayuda</Button>   {/* ← NUEVO */}
  <MenuUsuario />
</>
```

### Agregar una opción al menú «Mi cuenta»
`src/organismos/BarraSuperior/MenuUsuario.js` → un `<li>` más dentro del `<ul>`.

### Agregar un enlace al pie
`src/plantillas/menus.js` → una fila más en `ENLACES_PIE`.

---

## Tablas

### Agregar una columna a una tabla
Ejemplo: columna «Zona» en `paginas/organizacion/ProyectosOrg.js`. Son **dos** cambios, siempre juntos:
```jsx
<thead><tr>
  <th>Proyecto</th><th>Estado</th>
  <th>Zona</th>                          {/* 1) el encabezado */}
  <th>Acciones</th>
</tr></thead>
<tbody>
  {lista.map((p) => (
    <tr key={p.id}>
      <td data-l="Proyecto">…</td>
      <td data-l="Estado">…</td>
      <td data-l="Zona">{p.zona}</td>    {/* 2) la celda, con data-l */}
      <td className={sh.act}>…</td>
    </tr>
  ))}
</tbody>
```
`data-l="Zona"` es el rótulo que aparece en el móvil (donde cada fila se apila). Si lo olvidás, la columna se ve sin título en celular.
Para el ancho/estilo de columnas: `plantillas/disposicion.module.css` (`.table`).

### Agregar una acción (botón) a una fila
Dentro de `<td className={sh.act}><div className={sh.row}> … </div></td>` sumá otro `<Button>`.

### La tabla de «Mis postulaciones» (celdas con acciones afuera)
Es distinta: usa `.cells` (ver `paginas/colaboradora/Colaboradora.module.css`). Una columna nueva es un `<div>` más en la fila de encabezado **y** en cada fila.

---

## Formularios

### Agregar un campo
Dentro de la grilla `<div className={sh.form}>` de la pantalla, un `<Field/>` más:
```jsx
<Field label="Teléfono" optional placeholder="+54 11…" value={v.tel} onChange={set('tel')} />
```
- La grilla tiene 2 columnas y rellena fila por fila: el orden en el código es el orden en pantalla.
- `className={sh.r2}` → el campo ocupa 2 filas (ideal para textareas). `className={sh.full}` → ocupa todo el ancho. `sh.mid` → centrado vertical.
- Si es obligatorio, agregá su regla en la función de validación de esa pantalla (ej. `useForm` en `paginas/acceso/auxiliares.js`).

### Agregar opciones a un selector de etiquetas
`<TagPicker options={…}/>` toma sus opciones del array que le pasás (ej. `HABILIDADES` en `datos/datos.js`). Agregá el texto ahí.

---

## Tarjetas y listas

### Agregar una fila a la tarjeta de proyecto
`organismos/ProyectoCard/ProyectoCard.js` → un `<TicketRow label="…">valor</TicketRow>` más (cambia en todas las listas).
Para una fila solo en una pantalla: pasala por la prop `extra` (ej. «Tu rol» en `ProyectosCol.js`).

### Agregar un botón a la tarjeta
Pasá `footer={<> <Button/> <Button/> </>}` a `<ProyectoCard/>` desde la pantalla.

### Agregar una pestaña
En la pantalla: sumá `{ id: 'x', label: 'Texto' }` al array `tabs` de `<Tabs>` y un bloque `{tab === 'x' && (…)}` en el contenido.

---

## Componentes

### Nueva variante de botón (ej. «advertencia»)
1. `atomos/Button/Button.module.css`: clase `.warning { … }` y su `:hover`.
2. Usala: `<Button variant="warning">`. No hay que tocar `Button.js`.

### Nuevo estado en una insignia (ej. «En revisión»)
1. `atomos/StatusBadge/StatusBadge.js`: agregalo al objeto `ESTADOS` (ícono + texto).
2. `StatusBadge.module.css`: clase con su color.
Un estado **siempre** lleva texto e ícono (no depender solo del color).

### Nuevo ícono
`atomos/Icon/Icon.js` → una entrada en `PATHS` (trazo SVG en un viewBox de 12×12). Usalo con `<Icon name="…"/>`.

### Nuevo tipo de aviso (`Alert`)
Ícono en `ICONOS` de `moleculas/Alert/Alert.js` + clase de color en `Alert.module.css`.

---

## Pantallas y rutas

### Agregar una pantalla
1. Creá `paginas/<área>/MiPantalla.js` (copiá una parecida; el comentario de arriba te dice qué cambiar).
2. Importala en `App.js` y agregá su `<Route path="…" element={<MiPantalla/>}/>`.
3. Si es privada: envolvela en `<Privada rol="col">` o `<Privada rol="org">`.
4. Si va en el menú: `plantillas/menus.js`.

### Agregar un filtro a un listado
En `paginas/publico/Proyectos.js`: un `useState`, una condición dentro del `useMemo` y un `<Field>` en la sección «Filtros».
(Convención del proyecto: dentro de un grupo de opciones, el filtro es **OR**.)

---

## Conectar con el backend
1. Reemplazá cada `import { … } from '../../datos'` por una llamada Axios (`api.get('/proyectos')`).
2. `useLoading()` → el estado `loading` de la petición (los skeletons ya están puestos).
3. `contexto/Auth.js` → `entrar()` hace el POST de login y guarda el token; `Privada` ya redirige.
4. Los códigos de error del backend (ERR-…) se muestran con `<Alert kind="error">` o con `paginas/sistema/Errores.js`.

---

## ¿Qué pasa si saco…?

| Si sacás | Qué se rompe |
|---|---|
| `estilos/paleta.css` | Se pierden todos los colores (las variables quedan sin valor) |
| `estilos/titulos.css` | Los títulos pierden tamaño y tipografía |
| `plantillas/menus.js` | `LayoutPrincipal` no tiene menú |
| `atomos/Button` | Hay botones en casi todas las pantallas |
| `contexto/Auth.js` | No hay sesión: las rutas privadas y el menú dejan de funcionar |
| `moleculas/Skeletons` | Desaparecen los indicadores de carga (el enunciado los pide) |
| `moleculas/CaptchaMock` / `SocialButtons` | Solo cambian los formularios de acceso (son opcionales) |
