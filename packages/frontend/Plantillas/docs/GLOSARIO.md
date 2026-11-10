# Glosario para leer el código (React desde cero)

Si leés una pantalla y algo no se entiende, buscá la palabra acá. Cada entrada tiene un ejemplo **del propio proyecto**.

---

## Conceptos de React

### Componente
Una función que **devuelve lo que se ve en pantalla**. Su nombre empieza con mayúscula.
```jsx
function Saludo() {
  return <p>Hola</p>;
}
```
Cada archivo de `paginas/` es un componente: una pantalla completa.

### JSX
El HTML que se escribe dentro de JavaScript. Dos reglas:
- Lo que va entre `{ llaves }` es JavaScript: `<p>{nombre}</p>` muestra el valor de `nombre`.
- `class` se escribe `className`.

### Props
Los «parámetros» de un componente: lo que le pasás desde afuera.
```jsx
<Button variant="secondary" size="lg">Guardar</Button>
//       └─ props ─────────────────┘   └─ children (lo de adentro)
```
`children` es todo lo que va entre la apertura y el cierre de la etiqueta.

### Estado (`useState`)
Un valor que **la pantalla recuerda** y que, al cambiar, **vuelve a dibujarla**.
```jsx
const [busqueda, setBusqueda] = useState('');
//     valor      función que lo cambia     valor inicial
```
Nunca se modifica `busqueda` directo: siempre con `setBusqueda(nuevoValor)`.

### Hook
Una función que empieza con `use` y le da una «habilidad» al componente (`useState` recuerda cosas, `useMemo` calcula una vez, `useParams` lee la dirección). Se llaman siempre al principio del componente, nunca dentro de un `if`.

### Evento
Una función que se ejecuta cuando la persona hace algo: `onClick` (clic), `onChange` (escribe), `onSubmit` (envía el formulario).
```jsx
<Button onClick={abrirDialogo}>Borrar</Button>
```

### Formulario controlado
Un campo cuyo valor vive en el estado: `value` muestra el estado y `onChange` lo actualiza.
```jsx
<Field value={nombre} onChange={(e) => setNombre(e.target.value)} />
```
`e.target.value` es el texto que la persona acaba de escribir.

### Renderizado condicional
Mostrar algo solo si se cumple una condición:
```jsx
{error && <Alert>…</Alert>}              // si hay error, se muestra el aviso
{cargando ? <Skeleton /> : <Lista />}    // una cosa u otra
```

### Listas con `map` y `key`
Para dibujar un elemento por cada ítem de un array:
```jsx
{proyectos.map((p) => <ProyectoCard key={p.id} p={p} />)}
```
`key` es un identificador único por ítem: React lo necesita para no confundirse al reordenar.

### `useMemo`
Guarda el resultado de un cálculo y solo lo repite si cambian las variables de la lista final. Acá se usa para **filtrar listas**.
```jsx
const visibles = useMemo(() => proyectos.filter(…), [proyectos, busqueda]);
//                                                    └─ se recalcula solo si cambia alguna de estas
```

---

## Rutas (react-router)

| Pieza | Para qué sirve |
|---|---|
| `<Route path="proyectos/:id">` | Une una dirección con una pantalla. `:id` es una parte variable. |
| `useParams()` | Lee la parte variable: `/proyectos/48` → `{ id: '48' }` |
| `<Link to="/proyectos">` | Enlace interno (no recarga la página) |
| `useNavigate()` | Para ir a otra pantalla desde código: `navegar('/panel')` |
| `useSearchParams()` | Lee lo que va después del `?` en la dirección |

---

## JavaScript que aparece mucho

### Funciones flecha
`(p) => p.estado === 'abierto'` es una función de un solo paso. Se lee: «dado p, devolvé si su estado es abierto».

### Métodos de arrays
| Método | Qué hace | Ejemplo |
|---|---|---|
| `.filter(f)` | Se queda con los que cumplen | `proyectos.filter((p) => p.estado === 'abierto')` |
| `.map(f)` | Transforma cada uno | `nombres.map((n) => n.toUpperCase())` |
| `.find(f)` | Devuelve el primero que cumple | `COLECTIVOS.find((c) => c.id === 1)` |
| `.some(f)` | ¿Alguno cumple? (true/false) | `habilidades.some((h) => h === 'React')` |
| `.every(f)` | ¿Todos cumplen? | `perfiles.every((p) => p.rol !== '')` |
| `.includes(x)` | ¿Contiene x? | `['a','b'].includes('a')` |
| `.reduce(f, 0)` | Junta todo en un valor (ej. suma) | `hitos.reduce((suma, h) => suma + h.peso, 0)` |
| `.sort(f)` | Ordena | `lista.sort((a, b) => b.id - a.id)` |

### Operadores
- `&&` → «si lo de la izquierda es verdadero, usá lo de la derecha»: `cond && <X />`.
- `a ? b : c` → «si a, entonces b; si no, c».
- `a ?? b` → «a, pero si no existe, b».
- `?.` → «si existe, seguí»: `persona?.nombre` no falla si `persona` es `null`.

### Desestructurar
Sacar piezas de un objeto o array con nombre propio:
```js
const { id } = useParams();           // objeto: toma la propiedad id
const [valor, setValor] = useState(); // array: toma la posición 0 y la 1
```

### Copiar con cambios (`...`)
```js
setDatos({ ...datos, nombre: 'Ana' });   // copia datos y cambia solo el nombre
setLista([...lista, nuevo]);             // copia la lista y agrega uno al final
setLista(lista.filter((x) => x.id !== 3)); // copia la lista sin el 3
```
React exige **copiar**, no modificar el original.

### Plantillas de texto
`` `Proyecto #${p.id}` `` → mete el valor de `p.id` dentro del texto.

---

## Palabras propias del proyecto

| Palabra | Significa |
|---|---|
| `s.algo` | Una clase del `.module.css` de esa carpeta (estilos propios de la pantalla) |
| `sh.algo` | Una clase de `plantillas/disposicion.module.css` (layout común: `.page`, `.form`, `.table`) |
| `rol` | Quién tiene la sesión: `'col'` (colaboradora), `'org'` (organización) o `null` |
| `useLoading()` | Simula la espera de datos (`cargando`); se reemplaza por la API real |
| Skeleton | Bloques grises que ocupan el lugar mientras algo carga |
| Átomo / molécula / organismo | Niveles de componentes (ver `README.md`) |
