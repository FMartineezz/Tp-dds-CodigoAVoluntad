/**
 * PANTALLA BuscarColaboradoras
 * Ruta: /org/colaboradoras   ·   Quién la ve: Organización
 * Qué muestra: Búsqueda de colaboradoras (habilidad, mensajes). Quien desactivó mensajes
 * no muestra «Enviar mensaje».
 * Para modificarla: COLUMNA NUEVA: <th> + <td data-l="…">.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: texto buscado, habilidad elegida, filtro de mensajes y página actual.
 *   2. CÁLCULOS: colaboradoras que cumplen los filtros y cuántas páginas hay.
 *   3. ACCIONES: cambiar un filtro (vuelve a la página 1) y limpiar los filtros.
 *   4. LO QUE SE DIBUJA: título, filtros, tabla (o mensaje vacío) y paginador.
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Field, Heading, Icon, Tag } from '../../atomos';
import { Pager, RowsSkeleton } from '../../moleculas';
import { COLABORADORAS, HABILIDADES } from '../../datos';
import { useLoading } from '../../hooks';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Cuántas colaboradoras se muestran por página de la tabla.
const POR_PAGINA = 5;

export default function BuscarColaboradoras() {
  // ───── 1. DATOS Y ESTADO ─────
  // (ver docs/GLOSARIO.md → Estado (useState))

  // Texto del buscador (nombre o habilidad). Empieza vacío; lo cambia el campo «Buscar».
  const [busqueda, setBusqueda] = useState('');

  // Habilidad elegida: 'todas' o el nombre de una habilidad.
  // La cambia el desplegable «Habilidad».
  const [habilidadElegida, setHabilidadElegida] = useState('todas');

  // Filtro de mensajes: 'todos' | 'si' (habilitados) | 'no' (deshabilitados).
  // Lo cambia el desplegable «Mensajes».
  const [filtroMensajes, setFiltroMensajes] = useState('todos');

  // Número de página pedida (empieza en 1). La cambia el paginador y se reinicia a 1
  // cada vez que cambia un filtro.
  const [paginaPedida, setPaginaPedida] = useState(1);

  // true un instante (simula la espera de datos) y después false.
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Colaboradoras que cumplen los tres filtros a la vez (habilidad, mensajes y texto).
  // useMemo guarda el resultado y solo lo recalcula si cambia alguno de los filtros de la
  // lista final (ver docs/GLOSARIO.md → useMemo).
  const colaboradorasFiltradas = useMemo(() => {
    const textoBuscado = busqueda.trim().toLowerCase();

    // Responde si UNA colaboradora cumple todos los filtros.
    function cumpleLosFiltros(colaboradora) {
      // Habilidad: 'todas' deja pasar a todas; si no, tiene que tenerla.
      const cumpleHabilidad =
        habilidadElegida === 'todas' || colaboradora.habilidades.includes(habilidadElegida);

      // Mensajes: 'todos' deja pasar a todas; 'si' pide mensajes habilitados y 'no',
      // deshabilitados. `(filtro === 'si')` da true/false y se compara con lo que ella tiene.
      const cumpleMensajes =
        filtroMensajes === 'todos' || (filtroMensajes === 'si') === colaboradora.mensajes;

      // Texto: si no se escribió nada deja pasar a todas; si no, el texto tiene que estar
      // en el nombre o en alguna de sus habilidades (sin importar mayúsculas).
      // (.some → docs/GLOSARIO.md → Métodos de arrays: ¿alguna habilidad coincide?)
      const cumpleTexto =
        !textoBuscado ||
        colaboradora.nombre.toLowerCase().includes(textoBuscado) ||
        colaboradora.habilidades.some((habilidad) =>
          habilidad.toLowerCase().includes(textoBuscado)
        );

      return cumpleHabilidad && cumpleMensajes && cumpleTexto;
    }

    return COLABORADORAS.filter(cumpleLosFiltros);
  }, [busqueda, habilidadElegida, filtroMensajes]);

  // Cantidad total de páginas (siempre al menos 1, aunque no haya resultados).
  const totalPaginas = Math.max(1, Math.ceil(colaboradorasFiltradas.length / POR_PAGINA));

  // Página que realmente se muestra: nunca pasa de la última (por si al filtrar hay menos).
  const paginaActual = Math.min(paginaPedida, totalPaginas);

  // Las colaboradoras de la página actual: se recorta la lista filtrada.
  // Ej.: página 2 con 5 por página = posiciones 5 a 9.
  const colaboradorasDeLaPagina = colaboradorasFiltradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  // ───── 3. ACCIONES ─────

  // Devuelve la función que se ejecuta cuando cambia un filtro: guarda el valor nuevo con
  // `guardarValor` (el `set…` de ese filtro) y vuelve a la página 1, porque la lista
  // filtrada cambió.
  function alCambiarFiltro(guardarValor) {
    return function (e) {
      guardarValor(e.target.value);
      setPaginaPedida(1);
    };
  }

  // Se ejecuta al tocar «Limpiar filtros»: deja los tres filtros como al principio.
  function limpiarFiltros() {
    setBusqueda('');
    setHabilidadElegida('todas');
    setFiltroMensajes('todos');
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve en el lugar de la lista. Hay tres casos posibles.
  let contenidoDeLaLista;
  if (cargando) {
    // Caso 1: está cargando, filas grises de relleno.
    contenidoDeLaLista = <RowsSkeleton n={5} />;
  } else if (colaboradorasFiltradas.length === 0) {
    // Caso 2: ninguna coincide con los filtros.
    contenidoDeLaLista = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">Ninguna colaboradora coincide</Heading>
        <Button variant="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button>
      </div>
    );
  } else {
    // Caso 3: hay resultados, se dibuja la tabla con las de la página actual.
    contenidoDeLaLista = (
      <table className={sh.table}>
        <thead>
          <tr><th>Persona</th><th>Habilidades</th><th>Mensajes</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {colaboradorasDeLaPagina.map((colaboradora) => (
            <tr key={colaboradora.id}>
              <td data-l="Persona">
                <Link to={`/org/colaboradoras/${colaboradora.id}`} className={sh.person}>
                  <Avatar nombre={colaboradora.nombre} size={36} />
                  {colaboradora.nombre}
                </Link>
              </td>
              <td data-l="Habilidades">
                <span className={sh.tagsRow}>
                  {colaboradora.habilidades.map((habilidad) => (
                    <Tag key={habilidad}>{habilidad}</Tag>
                  ))}
                </span>
              </td>
              <td data-l="Mensajes">
                {/* Si acepta mensajes dice «Habilitados»; si no, «Deshabilitados»
                    con candado. */}
                {colaboradora.mensajes ? (
                  'Habilitados'
                ) : (
                  <span className={sh.muted}><Icon name="candado" />Deshabilitados</span>
                )}
              </td>
              <td className={sh.act}>
                <div className={sh.row}>
                  {/* Si acepta mensajes: «Enviar mensaje». Si no, solo «Ver perfil». */}
                  {colaboradora.mensajes ? (
                    <Button as={Link} to="/org/mensajes">Enviar mensaje</Button>
                  ) : (
                    <Button
                      as={Link}
                      to={`/org/colaboradoras/${colaboradora.id}`}
                      variant="secondary"
                    >
                      Ver perfil
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Buscar colaboradoras</Heading>

      {/* BLOQUE: Filtros — buscador, habilidad y mensajes */}
      <div className={s.buscar3}>
        <Field
          label="Buscar"
          type="search"
          placeholder="Nombre o habilidad"
          value={busqueda}
          onChange={alCambiarFiltro(setBusqueda)}
        />
        <Field
          as="select"
          label="Habilidad"
          value={habilidadElegida}
          onChange={alCambiarFiltro(setHabilidadElegida)}
        >
          <option value="todas">Todas</option>
          {/* Una opción por cada habilidad conocida. */}
          {HABILIDADES.map((habilidad) => (
            <option key={habilidad}>{habilidad}</option>
          ))}
        </Field>
        <Field
          as="select"
          label="Mensajes"
          value={filtroMensajes}
          onChange={alCambiarFiltro(setFiltroMensajes)}
        >
          <option value="todos">Todos</option>
          <option value="si">Habilitados</option>
          <option value="no">Deshabilitados</option>
        </Field>
      </div>

      {/* BLOQUE: Resultados — relleno gris si carga, mensaje si no hay, o la tabla */}
      {contenidoDeLaLista}

      {/* BLOQUE: Paginador — pasar de página (el número vuelve al estado paginaPedida) */}
      <Pager page={paginaActual} pages={totalPaginas} onChange={setPaginaPedida} />
    </div>
  );
}
