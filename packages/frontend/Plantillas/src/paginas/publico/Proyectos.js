/**
 * PANTALLA Proyectos
 * Ruta: /proyectos   ·   Quién la ve: Todas
 * Qué muestra: Listado con búsqueda, filtros (estado, colectivo, habilidades con lógica OR), orden y paginación.
 * Para modificarla: un filtro nuevo = un estado useState + una condición dentro del useMemo + un <Field> en la sección «Filtros».
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → lo que la pantalla recuerda: búsqueda, filtros elegidos, orden y
 *                        página actual (cada uno es un useState), más la sesión y la carga.
 *   2. CÁLCULOS        → de todos los proyectos, arma la lista que pasa los filtros, la ordena
 *                        y recorta solo los de la página actual.
 *   3. ACCIONES        → funciones que se ejecutan cuando la persona escribe, elige una opción,
 *                        pulsa una habilidad o toca «Limpiar filtros».
 *   4. LO QUE SE DIBUJA → encabezado, panel de filtros, contador, y la lista (o el mensaje
 *                        de «ningún proyecto coincide»).
 */
import { useState, useMemo } from 'react';
import { Button, Checkbox, Field, Heading, Text } from '../../atomos';
import { CardsSkeleton, Crumbs, Grid, Pager } from '../../moleculas';
import { ProyectoCard } from '../../organismos';
import { COLECTIVOS, HABILIDADES, PROYECTOS } from '../../datos';
import { useAuth } from '../../contexto';
import { useLoading } from '../../hooks';
import s from './Proyectos.module.css';

// Cuántas tarjetas de proyecto entran en cada página del listado.
const POR_PAGINA = 6;

export default function Proyectos() {
  // ───── 1. DATOS Y ESTADO ─────
  // Texto del buscador. Empieza vacío; lo cambia el campo «Buscar».
  const [busqueda, setBusqueda] = useState('');
  // Estado de proyecto elegido: 'todos' (sin filtrar), 'abierto' o 'cerrado'.
  // Lo cambia el desplegable «Estado».
  const [estado, setEstado] = useState('todos');
  // Colectivo elegido: 'todos' o el id del colectivo en texto (ej. '3').
  // Lo cambia el desplegable «Colectivo».
  const [colectivo, setColectivo] = useState('todos');
  // Habilidades pulsadas (ej. ['React', 'Node']). Empieza sin ninguna;
  // cada chip de habilidad la agrega o la saca.
  const [habilidadesElegidas, setHabilidadesElegidas] = useState([]);
  // Número de la página que se está viendo (empieza en 1).
  // Lo cambia el paginador y se vuelve a 1 al tocar un filtro.
  const [pagina, setPagina] = useState(1);
  // Criterio de orden: 'recientes', 'avance' o 'titulo'. Lo cambia el desplegable «Ordenar por».
  const [orden, setOrden] = useState('recientes');
  // true = mostrar solo proyectos que piden alguna de MIS_HABILIDADES.
  // Lo cambia el checkbox (solo lo ve una colaboradora).
  const [soloQueEncajan, setSoloQueEncajan] = useState(false);

  // Rol de la sesión: 'col' (colaboradora), 'org' (organización) o null (visitante).
  // Las llaves { } sacan solo la pieza que necesitamos (ver docs/GLOSARIO.md → Desestructurar).
  const { rol } = useAuth();
  // true un instante al entrar (simula la espera de datos);
  // mientras tanto se ven tarjetas grises.
  const cargando = useLoading();
  // Habilidades de la colaboradora de la demo; se usan para el filtro
  // «que encajan con mis habilidades».
  const MIS_HABILIDADES = ['React', 'Node'];

  // ───── 2. CÁLCULOS ─────
  // Lista completa de proyectos que pasan TODOS los filtros activos, ya ordenada.
  // useMemo guarda el resultado y solo lo recalcula si cambia algo de la lista final
  // (ver docs/GLOSARIO.md → useMemo).
  const proyectosFiltrados = useMemo(() => {
    // Texto de búsqueda sin espacios sobrantes y en minúsculas,
    // para comparar sin importar mayúsculas.
    const textoBuscado = busqueda.trim().toLowerCase();

    // .filter se queda solo con los proyectos que cumplen todas las condiciones de abajo
    // (ver docs/GLOSARIO.md → Métodos de arrays).
    const proyectosQuePasan = PROYECTOS.filter((proyecto) => {
      // Si el checkbox está apagado no se filtra; si está prendido, el proyecto tiene que
      // pedir al menos una de mis habilidades (.some = «¿alguna cumple?»).
      const pasaEncaje =
        !soloQueEncajan ||
        proyecto.habilidades.some((habilidad) => MIS_HABILIDADES.includes(habilidad));

      // Si el estado elegido es «todos» no se filtra por estado.
      const pasaEstado = estado === 'todos' || proyecto.estado === estado;

      // Si el colectivo elegido es «todos» no se filtra; si no, se compara el id
      // (se pasa a texto con String porque el valor del desplegable siempre es texto).
      const pasaColectivo =
        colectivo === 'todos' || String(proyecto.colectivoId) === colectivo;

      // Lógica OR: sin habilidades elegidas no se filtra; con habilidades elegidas
      // alcanza con que el proyecto pida CUALQUIERA de ellas.
      const pasaHabilidades =
        habilidadesElegidas.length === 0 ||
        habilidadesElegidas.some((habilidad) => proyecto.habilidades.includes(habilidad));

      // Sin texto buscado no se filtra; con texto, tiene que estar en el título
      // o en alguna de las habilidades del proyecto.
      const pasaBusqueda =
        !textoBuscado ||
        proyecto.titulo.toLowerCase().includes(textoBuscado) ||
        proyecto.habilidades.some((habilidad) =>
          habilidad.toLowerCase().includes(textoBuscado)
        );

      return pasaEncaje && pasaEstado && pasaColectivo && pasaHabilidades && pasaBusqueda;
    });

    // Se ordena una COPIA de la lista ([...lista] copia los elementos; ver
    // docs/GLOSARIO.md → Copiar con cambios) para no modificar la original.
    return [...proyectosQuePasan].sort(compararSegunOrden);
  }, [busqueda, estado, colectivo, habilidadesElegidas, orden, soloQueEncajan]);

  // Función que le dice a .sort cuál de dos proyectos va primero, según el orden elegido.
  // Devuelve un número negativo si `a` va antes, positivo si va después.
  function compararSegunOrden(a, b) {
    if (orden === 'recientes') {
      // Primero los de id más alto (los últimos creados).
      return b.id - a.id;
    }
    if (orden === 'avance') {
      // Primero los de mayor porcentaje de avance.
      return b.avance - a.avance;
    }
    // Orden 'titulo': alfabético A–Z respetando las reglas del castellano (tildes, ñ).
    return a.titulo.localeCompare(b.titulo, 'es');
  }

  // Cantidad total de páginas. Math.max(1, …) asegura que haya al menos 1
  // aunque no haya resultados.
  const cantidadPaginas = Math.max(1, Math.ceil(proyectosFiltrados.length / POR_PAGINA));
  // Página que realmente se muestra: si los filtros dejaron menos páginas que la elegida,
  // se usa la última que existe (así nunca se ve una página vacía).
  const paginaActual = Math.min(pagina, cantidadPaginas);
  // Los proyectos de la página actual: un recorte de la lista filtrada.
  const primerIndice = (paginaActual - 1) * POR_PAGINA;
  const proyectosVisibles = proyectosFiltrados.slice(
    primerIndice,
    primerIndice + POR_PAGINA
  );
  // Atajo para decidir qué se dibuja: ¿quedó al menos un proyecto después de filtrar?
  const hayResultados = proyectosFiltrados.length > 0;
  // Texto del contador, con singular o plural: «1 proyecto», «5 proyectos».
  const palabraProyecto = proyectosFiltrados.length === 1 ? 'proyecto' : 'proyectos';
  const textoContador = `${proyectosFiltrados.length} ${palabraProyecto}`;

  // ───── 3. ACCIONES ─────
  // Se ejecuta al escribir en «Buscar»: guarda el texto y vuelve a la página 1
  // (`evento.target.value` es lo que la persona acaba de escribir).
  function alEscribirBusqueda(evento) {
    setBusqueda(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al elegir una opción en el desplegable «Estado»; vuelve a la página 1.
  function alElegirEstado(evento) {
    setEstado(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al elegir una opción en «Ordenar por»; vuelve a la página 1.
  function alElegirOrden(evento) {
    setOrden(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al elegir una opción en «Colectivo»; vuelve a la página 1.
  function alElegirColectivo(evento) {
    setColectivo(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al tildar o destildar «solo proyectos que encajan con mis habilidades».
  // `evento.target.checked` es true o false según quedó la casilla.
  function alCambiarEncaje(evento) {
    setSoloQueEncajan(evento.target.checked);
    setPagina(1);
  }

  // Se ejecuta al pulsar un chip de habilidad: si ya estaba elegida la saca,
  // si no estaba la agrega. Siempre se arma una lista nueva (React no admite modificar la vieja).
  function alPulsarHabilidad(habilidad) {
    if (habilidadesElegidas.includes(habilidad)) {
      // .filter sin esa habilidad = «sacarla de la lista»
      setHabilidadesElegidas(
        habilidadesElegidas.filter((elegida) => elegida !== habilidad)
      );
    } else {
      // [...lista, nueva] = copia la lista y agrega la habilidad al final
      setHabilidadesElegidas([...habilidadesElegidas, habilidad]);
    }
    setPagina(1);
  }

  // Se ejecuta al tocar «Limpiar filtros» (cuando no hay resultados):
  // deja todos los filtros como al principio. Ojo: no cambia el orden elegido.
  function limpiarFiltros() {
    setBusqueda('');
    setEstado('todos');
    setColectivo('todos');
    setHabilidadesElegidas([]);
    setSoloQueEncajan(false);
    setPagina(1);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Proyectos' }]} />

      {/* BLOQUE: Encabezado — título de la página y frase de invitación */}
      <header className={s.head}>
        <Heading level={1}>Proyectos</Heading>
        <Text variant="lead">Elegí uno que te quede cómodo y postulate. Cada hora cuenta.</Text>
      </header>

      {/* BLOQUE: Filtros — buscador, desplegables, checkbox de encaje y chips de habilidades */}
      <section className={s.filters} aria-label="Filtros">
        <Field
          label="Buscar"
          type="search"
          placeholder="Nombre o habilidad"
          value={busqueda}
          onChange={alEscribirBusqueda}
        />
        <Field as="select" label="Estado" value={estado} onChange={alElegirEstado}>
          <option value="todos">Todos</option>
          <option value="abierto">Abiertos</option>
          <option value="cerrado">Cerrados</option>
        </Field>
        <Field as="select" label="Ordenar por" value={orden} onChange={alElegirOrden}>
          <option value="recientes">Más recientes</option>
          <option value="avance">Mayor avance</option>
          <option value="titulo">Título (A–Z)</option>
        </Field>
        <Field as="select" label="Colectivo" value={colectivo} onChange={alElegirColectivo}>
          <option value="todos">Todos</option>
          {/* Una opción por cada colectivo que tiene al menos un proyecto
              (se ocultan los colectivos sin proyectos). */}
          {COLECTIVOS
            .filter((colectivoDeLaLista) =>
              PROYECTOS.some((proyecto) => proyecto.colectivoId === colectivoDeLaLista.id)
            )
            .map((colectivoDeLaLista) => (
              <option key={colectivoDeLaLista.id} value={colectivoDeLaLista.id}>
                {colectivoDeLaLista.nombre}
              </option>
            ))}
        </Field>

        {/* El checkbox de «encaje» aparece solo si quien mira es una colaboradora (rol 'col').
            `&&` significa: si lo de la izquierda es verdadero, se dibuja lo de la derecha
            (ver docs/GLOSARIO.md → Renderizado condicional). */}
        {rol === 'col' && (
          <div className={s.encaje}>
            <Checkbox checked={soloQueEncajan} onChange={alCambiarEncaje}>
              Mostrar solo proyectos que encajan con mis habilidades (
              {MIS_HABILIDADES.join(', ')})
            </Checkbox>
          </div>
        )}

        <fieldset className={s.skills}>
          <legend>Habilidades (cualquiera de las elegidas)</legend>
          <div className={s.chips}>
            {/* Un botón-chip por cada habilidad; `aria-pressed` avisa a los lectores de
                pantalla si está elegida. */}
            {HABILIDADES.map((habilidad) => (
              <button
                key={habilidad}
                type="button"
                className={s.chip}
                aria-pressed={habilidadesElegidas.includes(habilidad)}
                onClick={() => alPulsarHabilidad(habilidad)}
              >
                {habilidad}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {/* BLOQUE: Contador — «Cargando…» o cuántos proyectos hay (con singular/plural) */}
      <p className={s.count} role="status">
        {cargando ? 'Cargando…' : textoContador}
      </p>

      {/* BLOQUE: Resultados — tres casos posibles, solo se ve uno a la vez */}
      {/* Caso 1: todavía cargando → tarjetas grises de relleno. */}
      {cargando && <CardsSkeleton />}

      {/* Caso 2: ya cargó y hay proyectos → tarjetas de la página actual + paginador. */}
      {!cargando && hayResultados && (
        <>
          <Grid>
            {proyectosVisibles.map((proyecto) => (
              <ProyectoCard key={proyecto.id} p={proyecto} />
            ))}
          </Grid>
          <Pager page={paginaActual} pages={cantidadPaginas} onChange={setPagina} />
        </>
      )}

      {/* Caso 3: ya cargó pero ningún proyecto pasó los filtros → mensaje y botón para limpiar. */}
      {!cargando && !hayResultados && (
        <div className={s.empty}>
          <Heading level={2} size="h3">Ningún proyecto coincide</Heading>
          <Text>Probá con menos filtros.</Text>
          <Button variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>
        </div>
      )}
    </div>
  );
}
