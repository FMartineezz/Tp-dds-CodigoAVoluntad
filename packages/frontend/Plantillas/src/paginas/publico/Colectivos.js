/**
 * PANTALLA Colectivos
 * Ruta: /colectivos   ·   Quién la ve: Todas
 * Qué muestra: Directorio alfabético con filtros laterales (tipo, ubicación, causa) y orden.
 * Para modificarla: un grupo de filtros nuevo = otro <Grupo/> en la barra lateral + su condición en useMemo.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · Grupo (componente chico) → un bloque de casillas con título (Tipo, Ubicación, Causa).
 *   1. DATOS Y ESTADO  → lo que la pantalla recuerda: texto de búsqueda, casillas tildadas,
 *                        orden, página actual y si el panel de filtros está desplegado
 *                        en celular.
 *   2. CÁLCULOS        → arma la lista de colectivos que pasan los filtros, la ordena,
 *                        recorta la página actual y decide bajo qué letras se agrupan.
 *   3. ACCIONES        → funciones que reaccionan cuando la persona escribe, tilda una
 *                        casilla, cambia el orden o toca «Limpiar filtros».
 *   4. LO QUE SE DIBUJA → título, panel lateral de filtros, contador, orden y la lista
 *                        agrupada por letra (o mensajes de carga / sin resultados).
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Checkbox, Field, Heading, Icon, Text } from '../../atomos';
import { Pager, RowsSkeleton } from '../../moleculas';
import { CAUSAS, COLECTIVOS, TIPOS } from '../../datos';
import { useLoading } from '../../hooks';
import s from './Colectivos.module.css';

// Cuántos colectivos entran en cada página del directorio.
const POR_PAGINA = 6;

// Marca especial que se usa como «letra» cuando el orden NO es alfabético:
// en ese caso hay una sola sección sin letra de cabecera.
const SIN_LETRA = '*';

// ═════ COMPONENTE AUXILIAR: Grupo ═════
// Un grupo de casillas con título (por ejemplo «Tipo de colectivo»).
// Props: `titulo` (el texto de arriba), `opciones` (lista de textos, una casilla por cada uno),
// `valor` (las opciones tildadas ahora) y `onChange` (función a la que se le avisa la nueva lista).
function Grupo({ titulo, opciones, valor, onChange }) {
  // Se ejecuta al tildar o destildar una casilla: si la opción ya estaba tildada la saca
  // de la lista, y si no estaba la agrega. Siempre avisa con una lista nueva
  // (ver docs/GLOSARIO.md → Copiar con cambios).
  function alCambiarOpcion(opcion) {
    if (valor.includes(opcion)) {
      // .filter con «distinta de esta opción» = sacarla de la lista
      onChange(valor.filter((tildada) => tildada !== opcion));
    } else {
      // [...valor, opcion] = copia la lista y agrega la opción al final
      onChange([...valor, opcion]);
    }
  }

  return (
    <fieldset className={s.grupo}>
      <legend>{titulo}</legend>
      {/* Una casilla por cada opción; `key` identifica cada una
          (ver docs/GLOSARIO.md → Listas con map y key) */}
      {opciones.map((opcion) => (
        <Checkbox
          key={opcion}
          checked={valor.includes(opcion)}
          onChange={() => alCambiarOpcion(opcion)}
        >
          {opcion}
        </Checkbox>
      ))}
    </fieldset>
  );
}

// ═════ PANTALLA ═════
export default function Colectivos() {
  // ───── 1. DATOS Y ESTADO ─────
  // Texto del buscador por nombre. Empieza vacío; lo cambia el campo «Nombre».
  const [busqueda, setBusqueda] = useState('');
  // Tipos de colectivo tildados (ej. ['Asamblea']). Empieza sin ninguno; lo cambia el grupo «Tipo».
  const [tiposElegidos, setTiposElegidos] = useState([]);
  // Ubicaciones tildadas. Empieza sin ninguna; lo cambia el grupo «Ubicación».
  const [ubicacionesElegidas, setUbicacionesElegidas] = useState([]);
  // Criterio de orden: 'az' (alfabético) o 'abiertos' (más proyectos abiertos primero).
  // Lo cambia el desplegable «Ordenar por».
  const [orden, setOrden] = useState('az');
  // true un instante al entrar (simula la espera de datos); mientras tanto se ven filas grises.
  const cargando = useLoading();
  // Causas tildadas. Empieza sin ninguna; lo cambia el grupo «Causa».
  const [causasElegidas, setCausasElegidas] = useState([]);
  // Número de la página que se ve (empieza en 1). Lo cambia el paginador
  // y vuelve a 1 al tocar un filtro.
  const [pagina, setPagina] = useState(1);
  // true = el panel de filtros está desplegado (solo importa en pantallas chicas).
  // Lo cambia el botón «Filtrar».
  const [filtrosDesplegados, setFiltrosDesplegados] = useState(false);

  // ───── 2. CÁLCULOS ─────
  // Ubicaciones que de verdad tienen algún colectivo, sin repetir y en orden alfabético.
  // `new Set` descarta repetidos y `[...]` lo vuelve a convertir en lista
  // (ver docs/GLOSARIO.md → Copiar con cambios).
  const ubicacionesUsadas = [
    ...new Set(COLECTIVOS.map((colectivo) => colectivo.ubicacion)),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  // Lista completa de colectivos que pasan los filtros, ya ordenada.
  // useMemo guarda el resultado y solo lo recalcula si cambia algo de la lista final
  // (ver docs/GLOSARIO.md → useMemo).
  const colectivosFiltrados = useMemo(() => {
    // Texto buscado sin espacios sobrantes y en minúsculas (para no distinguir mayúsculas).
    const textoBuscado = busqueda.trim().toLowerCase();
    // ¿Hay alguna casilla tildada en cualquiera de los tres grupos?
    const hayFiltrosTildados =
      tiposElegidos.length + ubicacionesElegidas.length + causasElegidas.length > 0;

    // .filter se queda con los colectivos que cumplen las dos condiciones de abajo
    // (ver docs/GLOSARIO.md → Métodos de arrays).
    const colectivosQuePasan = COLECTIVOS.filter((colectivo) => {
      // Sin texto buscado no se filtra; con texto, el nombre tiene que contenerlo.
      const pasaBusqueda =
        !textoBuscado || colectivo.nombre.toLowerCase().includes(textoBuscado);

      // Lógica OR entre las casillas: sin nada tildado no se filtra; con casillas tildadas
      // alcanza con cumplir CUALQUIERA (tipo, ubicación o alguna de sus causas).
      const pasaCasillas =
        !hayFiltrosTildados ||
        tiposElegidos.includes(colectivo.tipo) ||
        ubicacionesElegidas.includes(colectivo.ubicacion) ||
        colectivo.causas.some((causa) => causasElegidas.includes(causa));

      return pasaBusqueda && pasaCasillas;
    });

    // Se ordena una COPIA de la lista para no modificar la original.
    return [...colectivosQuePasan].sort(compararSegunOrden);
  }, [busqueda, tiposElegidos, ubicacionesElegidas, causasElegidas, orden]);

  // Función que le dice a .sort cuál de dos colectivos va primero, según el orden elegido.
  // Devuelve un número negativo si `a` va antes, positivo si va después.
  function compararSegunOrden(a, b) {
    if (orden === 'az') {
      // Alfabético por nombre, respetando las reglas del castellano (tildes, ñ).
      return a.nombre.localeCompare(b.nombre, 'es');
    }
    // Orden 'abiertos': primero el que tiene más proyectos abiertos; si empatan
    // (la resta da 0, que cuenta como «falso» para ||), desempata el nombre A–Z.
    return b.abiertos - a.abiertos || a.nombre.localeCompare(b.nombre, 'es');
  }

  // Cantidad total de páginas. Math.max(1, …) asegura al menos 1 aunque no haya resultados.
  const cantidadPaginas = Math.max(1, Math.ceil(colectivosFiltrados.length / POR_PAGINA));
  // Página que realmente se muestra: si los filtros dejaron menos páginas que la elegida,
  // se usa la última que existe (así nunca se ve una página vacía).
  const paginaActual = Math.min(pagina, cantidadPaginas);
  // Los colectivos de la página actual: un recorte de la lista filtrada.
  const primerIndice = (paginaActual - 1) * POR_PAGINA;
  const colectivosVisibles = colectivosFiltrados.slice(primerIndice, primerIndice + POR_PAGINA);

  // Primera letra del nombre del colectivo, en mayúscula (ej. «Asamblea…» → «A»).
  function primeraLetra(colectivo) {
    return colectivo.nombre[0].toUpperCase();
  }

  // Letras bajo las que se agrupan los colectivos de la página (una sección por letra).
  // Con orden alfabético: las primeras letras de los nombres, sin repetir (de nuevo `new Set`).
  // Con otro orden: una única sección sin letra de cabecera (SIN_LETRA).
  let letras;
  if (orden === 'az') {
    letras = [...new Set(colectivosVisibles.map((colectivo) => primeraLetra(colectivo)))];
  } else {
    letras = [SIN_LETRA];
  }

  // Atajos para decidir qué se dibuja en el listado.
  const noHayResultados = colectivosFiltrados.length === 0;
  // Texto del contador, con singular o plural: «1 colectivo», «4 colectivos».
  const palabraColectivo = colectivosFiltrados.length === 1 ? 'colectivo' : 'colectivos';
  const textoContador = `${colectivosFiltrados.length} ${palabraColectivo}`;

  // ───── 3. ACCIONES ─────
  // Se ejecuta al escribir en «Nombre»: guarda el texto y vuelve a la página 1
  // (`evento.target.value` es lo que la persona acaba de escribir).
  function alEscribirBusqueda(evento) {
    setBusqueda(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al cambiar las casillas de «Tipo de colectivo»: guarda la lista nueva
  // y vuelve a la página 1.
  function alCambiarTipos(nuevosTipos) {
    setTiposElegidos(nuevosTipos);
    setPagina(1);
  }

  // Se ejecuta al cambiar las casillas de «Ubicación»: guarda la lista nueva
  // y vuelve a la página 1.
  function alCambiarUbicaciones(nuevasUbicaciones) {
    setUbicacionesElegidas(nuevasUbicaciones);
    setPagina(1);
  }

  // Se ejecuta al cambiar las casillas de «Causa»: guarda la lista nueva
  // y vuelve a la página 1.
  function alCambiarCausas(nuevasCausas) {
    setCausasElegidas(nuevasCausas);
    setPagina(1);
  }

  // Se ejecuta al elegir una opción en «Ordenar por»; vuelve a la página 1.
  function alElegirOrden(evento) {
    setOrden(evento.target.value);
    setPagina(1);
  }

  // Se ejecuta al tocar «Filtrar» (visible en celular): despliega u oculta el panel.
  // Recibe el valor anterior y devuelve su opuesto (true pasa a false y viceversa).
  function alTocarFiltrar() {
    setFiltrosDesplegados((estabaDesplegado) => !estabaDesplegado);
  }

  // Se ejecuta al tocar «Limpiar filtros» (cuando no hay resultados): vacía el texto y todas
  // las casillas. Ojo: no cambia el orden ni la página elegidos.
  function limpiarFiltros() {
    setBusqueda('');
    setTiposElegidos([]);
    setUbicacionesElegidas([]);
    setCausasElegidas([]);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Heading level={1}>Colectivos</Heading>
      <div className={s.layout}>
        {/* BLOQUE: Panel lateral de filtros — buscador por nombre y tres grupos de casillas */}
        <aside className={s.side} aria-label="Filtros">
          <Button
            variant="secondary"
            className={s.toggle}
            aria-expanded={filtrosDesplegados}
            onClick={alTocarFiltrar}
          >
            Filtrar
          </Button>
          {/* La clase `open` se agrega solo cuando el panel está desplegado
              (plantilla de texto; ver docs/GLOSARIO.md → Plantillas de texto) */}
          <div className={`${s.filtros} ${filtrosDesplegados ? s.open : ''}`}>
            <Heading level={2} size="h3">Filtrar</Heading>
            <Field
              label="Nombre"
              type="search"
              placeholder="Buscar colectivo"
              value={busqueda}
              onChange={alEscribirBusqueda}
            />
            <Grupo
              titulo="Tipo de colectivo"
              opciones={TIPOS}
              valor={tiposElegidos}
              onChange={alCambiarTipos}
            />
            <Grupo
              titulo="Ubicación"
              opciones={ubicacionesUsadas}
              valor={ubicacionesElegidas}
              onChange={alCambiarUbicaciones}
            />
            <Grupo
              titulo="Causa"
              opciones={CAUSAS}
              valor={causasElegidas}
              onChange={alCambiarCausas}
            />
            <Text variant="small">
              Se muestran los colectivos que cumplan con cualquiera de las opciones elegidas.
            </Text>
          </div>
        </aside>

        <div className={s.dir}>
          {/* BLOQUE: Barra superior del directorio — contador y selector de orden */}
          <div className={s.barra}>
            <p className={s.count} role="status">
              {cargando ? 'Cargando…' : textoContador}
            </p>
            <Field
              as="select"
              label="Ordenar por"
              value={orden}
              onChange={alElegirOrden}
              className={s.orden}
            >
              <option value="az">Nombre (A–Z)</option>
              <option value="abiertos">Más proyectos abiertos</option>
            </Field>
          </div>

          {/* BLOQUE: Listado — tres casos posibles, solo se ve uno a la vez */}
          {/* Caso 1: todavía cargando → 5 filas grises de relleno. */}
          {cargando && <RowsSkeleton n={5} />}

          {/* Caso 2: ya cargó pero ningún colectivo pasó los filtros → mensaje y botón. */}
          {!cargando && noHayResultados && (
            <div className={s.empty}>
              <Heading level={2} size="h3">Ningún colectivo coincide</Heading>
              <Button variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>
            </div>
          )}

          {/* Caso 3: ya cargó y hay colectivos → una sección por letra, cada una con su lista. */}
          {!cargando && !noHayResultados && letras.map((letra) => {
            // De los colectivos de esta página, los que corresponden a esta sección:
            // todos si no hay letras (SIN_LETRA), o los que empiezan con esa letra.
            const colectivosDeLaSeccion = colectivosVisibles.filter(
              (colectivo) => letra === SIN_LETRA || primeraLetra(colectivo) === letra
            );

            return (
              <section
                key={letra}
                aria-label={letra === SIN_LETRA ? 'Colectivos' : `Letra ${letra}`}
              >
                {/* La letra grande de cabecera se ve solo cuando se agrupa por letras */}
                {letra !== SIN_LETRA && (
                  <div className={s.letra} aria-hidden="true">{letra}</div>
                )}
                <ul className={s.lista}>
                  {colectivosDeLaSeccion.map((colectivo) => (
                    <li key={colectivo.id}>
                      {/* Cada colectivo es un enlace a su pantalla de detalle */}
                      <Link to={`/colectivos/${colectivo.id}`} className={s.row}>
                        <Avatar nombre={colectivo.nombre} size={56} square />
                        <span className={s.info}>
                          <b>{colectivo.nombre}</b>
                          <small>
                            {colectivo.tipo} · {colectivo.ubicacion} · {colectivo.causas.join(', ')}
                          </small>
                        </span>
                        <span className={s.abiertos}>
                          <b>{colectivo.abiertos}</b>
                          <small>{colectivo.abiertos === 1 ? 'abierto' : 'abiertos'}</small>
                        </span>
                        <Icon name="chevron-der" size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {/* BLOQUE: Paginador — se dibuja siempre, debajo del listado */}
          <Pager page={paginaActual} pages={cantidadPaginas} onChange={setPagina} />
        </div>
      </div>
    </div>
  );
}
