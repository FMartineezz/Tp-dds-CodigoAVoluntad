/**
 * PANTALLA BuscarColaboradoras
 * Ruta: /org/colaboradoras   ·   Quién la ve: Organización
 * Qué muestra: Colaboradoras de la plataforma, página por página, o solo las que encajan
 * con un perfil de mis proyectos. Quien desactivó mensajes no muestra «Enviar mensaje».
 * De dónde salen los datos: GET /colaboradoras?pagina=&limite= o, si se elige un perfil,
 *   GET /proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes (paginado).
 *   Los perfiles del filtro salen de mis proyectos (GET /colectivos/:id/proyectos).
 *   Filtros de «Todos los colaboradores»: nombre, habilidad y «solo quienes aceptan
 *   mensajes» (GET /colaboradoras?busqueda=&habilidad=&aceptaMensajes=true). Los resuelve el
 *   backend, así la paginación sigue contando bien. El endpoint de acordes no los acepta:
 *   con un perfil elegido se deshabilitan.
 * Para modificarla: COLUMNA NUEVA: <th> + <td data-l="…">.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: perfil elegido, página actual y los pedidos al backend.
 *   2. CÁLCULOS: las opciones del filtro y qué proyecto acompaña al mensaje.
 *   3. ACCIONES: cambiar el perfil (vuelve a la página 1).
 *   4. LO QUE SE DIBUJA: título, filtro, tabla (o mensaje vacío / error) y paginador.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Checkbox, Field, Heading, Icon, Tag } from '../../atomos';
import { Alert, Pager, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { useDemorado, usePedido } from '../../hooks';
import { obtenerHabilidades } from '../../api/habilidades.js';
import { mensajeDeError } from '../../api/errores.js';
import {
  obtenerColaboradoras,
  obtenerColaboradorasAcordes,
  obtenerProyectosDelColectivo,
} from '../../api/organizacion.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';
import { fotoDe } from '../../datos/fotos.js';

// Cuántas colaboradoras se piden por página.
const POR_PAGINA = 10;

// Filtros sin completar ('' o false = no filtrar por eso).
const FILTROS_VACIOS = { busqueda: '', habilidad: '', aceptaMensajes: false };

// Pide la página `pagina`: de todas las personas (con los filtros), o de las acordes al
// perfil elegido. `perfilElegido` es 'todas' o un texto «idProyecto|idPerfil».
function pedirPagina(perfilElegido, pagina, filtros) {
  if (perfilElegido === 'todas') return obtenerColaboradoras({ pagina, limite: POR_PAGINA, ...filtros });
  const [proyectoId, perfilId] = perfilElegido.split('|');
  return obtenerColaboradorasAcordes(proyectoId, perfilId, { pagina, limite: POR_PAGINA });
}

export default function BuscarColaboradoras() {
  // ───── 1. DATOS Y ESTADO ─────
  // (ver packages/frontend/docs/GLOSARIO.md → Estado (useState))
  const { id } = useAuth();

  // Perfil elegido en el filtro: 'todas' o «idProyecto|idPerfil». Lo cambia el desplegable.
  const [perfilElegido, setPerfilElegido] = useState('todas');

  // Número de página (empieza en 1). La cambia el paginador y vuelve a 1 al cambiar el filtro.
  const [pagina, setPagina] = useState(1);

  // Nombre, habilidad y «acepta mensajes» (ver FILTROS_VACIOS).
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  // El nombre viaja recién cuando deja de escribir, no en cada tecla.
  const busquedaDemorada = useDemorado(filtros.busqueda);
  // Catálogo de habilidades para el desplegable.
  const { datos: habilidades } = usePedido(() => obtenerHabilidades(), []);

  // Mis proyectos (para armar las opciones del filtro). Se piden una sola vez.
  const { datos: misProyectos } = usePedido(() => obtenerProyectosDelColectivo(id), [id]);

  // La página de colaboradoras. Se vuelve a pedir cuando cambia el filtro o la página.
  const { cargando, datos: resultado, error } = usePedido(
    () =>
      pedirPagina(perfilElegido, pagina, {
        busqueda: busquedaDemorada.trim(),
        habilidad: filtros.habilidad,
        aceptaMensajes: filtros.aceptaMensajes,
      }),
    [perfilElegido, pagina, busquedaDemorada, filtros.habilidad, filtros.aceptaMensajes]
  );

  // ───── 2. CÁLCULOS ─────

  // Opciones del filtro: una por cada perfil de cada proyecto abierto.
  // (.flatMap = .map que «aplana»: devuelve una sola lista con los perfiles de todos)
  const opcionesDePerfil = (misProyectos ?? [])
    .filter((proyecto) => proyecto.estado === 'abierto')
    .flatMap((proyecto) =>
      proyecto.perfiles.map((perfil) => ({
        valor: `${proyecto.id}|${perfil.id}`,
        texto: `${proyecto.titulo} · ${perfil.descripcion}`,
      }))
    );

  // Para escribirle a alguien hace falta un proyecto: si se filtró por perfil, es ese.
  const proyectoDelFiltro = perfilElegido === 'todas' ? null : perfilElegido.split('|')[0];

  const colaboradoras = resultado?.resultados ?? [];
  const totalPaginas = resultado?.totalPaginas ?? 1;

  // ───── 3. ACCIONES ─────

  // Guarda un filtro y vuelve a la página 1. `valor` ya viene listo (texto o true/false).
  function cambiarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
    setPagina(1);
  }

  // Con un perfil elegido se usa el endpoint de acordes, que no acepta estos filtros.
  const filtrosDeshabilitados = perfilElegido !== 'todas';

  // Se ejecuta al cambiar el perfil: guarda el valor y vuelve a la página 1.
  function alCambiarPerfil(e) {
    setPerfilElegido(e.target.value);
    setPagina(1);
  }

  // Botón de la derecha de cada fila. Si acepta mensajes y hay un proyecto elegido:
  // «Enviar mensaje» (abre Mensajes con esa persona y ese proyecto). Si no: «Ver perfil»
  // (desde el perfil se elige el proyecto para escribirle).
  function accionDe(colaboradora) {
    if (colaboradora.mensajes && proyectoDelFiltro) {
      return (
        <Button as={Link} to={`/org/mensajes?persona=${colaboradora.id}&proyecto=${proyectoDelFiltro}`}>
          Enviar mensaje
        </Button>
      );
    }
    return (
      <Button as={Link} to={`/org/colaboradoras/${colaboradora.id}`} variant="secondary">
        Ver perfil
      </Button>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve en el lugar de la lista. Hay cuatro casos posibles.
  let contenidoDeLaLista;
  if (cargando) {
    // Caso 1: está cargando, filas grises de relleno.
    contenidoDeLaLista = <RowsSkeleton n={5} />;
  } else if (error) {
    // Caso 2: el pedido falló.
    contenidoDeLaLista = (
      <Alert kind="error" title="No pudimos cargar a los colaboradores">{mensajeDeError(error)}</Alert>
    );
  } else if (colaboradoras.length === 0) {
    // Caso 3: no hay resultados.
    contenidoDeLaLista = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">Ningún colaborador coincide</Heading>
        {perfilElegido !== 'todas' && (
          <Button variant="secondary" onClick={() => alCambiarPerfil({ target: { value: 'todas' } })}>
            Ver todas
          </Button>
        )}
      </div>
    );
  } else {
    // Caso 4: hay resultados, se dibuja la tabla de esta página.
    contenidoDeLaLista = (
      <table className={sh.table}>
        <thead>
          <tr><th>Persona</th><th>Habilidades</th><th>Mensajes</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {colaboradoras.map((colaboradora) => (
            <tr key={colaboradora.id}>
              <td data-l="Persona">
                <Link to={`/org/colaboradoras/${colaboradora.id}`} className={sh.person}>
                  <Avatar nombre={colaboradora.nombre} size={36} foto={fotoDe(colaboradora.id)} />
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
                {/* Si acepta mensajes dice «Habilitados»; si no, «Deshabilitados» con candado. */}
                {colaboradora.mensajes ? (
                  'Habilitados'
                ) : (
                  <span className={sh.muted}><Icon name="candado" />Deshabilitados</span>
                )}
              </td>
              <td className={sh.actions}>
                <div className={sh.row}>{accionDe(colaboradora)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Buscar colaboradores</Heading>

      {/* BLOQUE: Filtro — todas o las acordes a un perfil de mis proyectos abiertos */}
      <div className={s.buscar}>
        <Field
          as="select"
          label="Acordes al perfil"
          value={perfilElegido}
          onChange={alCambiarPerfil}
        >
          <option value="todas">Todos los colaboradores</option>
          {opcionesDePerfil.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
          ))}
        </Field>
        <Field
          label="Nombre"
          type="search"
          placeholder="Nombre o alias"
          value={filtros.busqueda}
          onChange={(e) => cambiarFiltro('busqueda', e.target.value)}
          disabled={filtrosDeshabilitados}
        />
        <Field
          as="select"
          label="Habilidad"
          value={filtros.habilidad}
          onChange={(e) => cambiarFiltro('habilidad', e.target.value)}
          disabled={filtrosDeshabilitados}
        >
          <option value="">Todas</option>
          {(habilidades ?? []).map((habilidad) => (
            <option key={habilidad.codigo} value={habilidad.codigo}>{habilidad.titulo}</option>
          ))}
        </Field>
        <div className={s.buscarOpciones}>
          <Checkbox
            checked={filtros.aceptaMensajes}
            onChange={(e) => cambiarFiltro('aceptaMensajes', e.target.checked)}
            disabled={filtrosDeshabilitados}
          >
            Solo quienes aceptan mensajes
          </Checkbox>
          {filtrosDeshabilitados && (
            <span className={s.nota}>Con un perfil elegido se muestran todas las personas acordes.</span>
          )}
        </div>
      </div>

      {/* BLOQUE: Resultados — relleno gris si carga, error, mensaje si no hay, o la tabla */}
      {contenidoDeLaLista}

      {/* BLOQUE: Paginador — cambia la página y se pide la nueva al backend */}
      <Pager page={pagina} pages={totalPaginas} onChange={setPagina} />
    </div>
  );
}
