/**
 * PANTALLA ProyectosAdm
 * Ruta: /admin/proyectos   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Todos los proyectos para revisarlos, con búsqueda y filtro por estado. Cada
 *   uno lleva a su página pública y a su colectivo.
 * De dónde salen los datos: GET /proyectos?busqueda=&estado= (api/proyectos.js).
 * PENDIENTE (backend): no hay acciones administrativas sobre proyectos (suspender, marcar
 *   destacado); cuando existan, van como botones en la columna «Acciones».
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: filtros, página y la lista (del backend).
 *      ESPERA Y ERRORES: aviso de error (mientras carga se ven filas grises bajo los filtros).
 *   2. CÁLCULOS: no hay.
 *   3. ACCIONES: cambiar un filtro (vuelve a la página 1).
 *   4. LO QUE SE DIBUJA: filtros, tabla y paginación.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Field, Heading, StatusBadge, Text } from '../../atomos';
import { Alert, Pager, RowsSkeleton } from '../../moleculas';
import { useDemorado, usePedido } from '../../hooks';
import { obtenerProyectos } from '../../api/proyectos.js';
import { mensajeDeError } from '../../api/errores.js';
import sh from '../../plantillas/disposicion.module.css';

const POR_PAGINA = 10;

// Estados que entiende el filtro del backend → texto del desplegable.
const ESTADOS = { abierto: 'Buscan gente', en_curso: 'En curso', finalizado: 'Finalizados' };

export default function ProyectosAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);

  // La búsqueda se manda recién cuando se deja de escribir (ver hooks/useDemorado.js).
  const busquedaDemorada = useDemorado(busqueda);
  const { cargando, datos, error } = usePedido(
    () => obtenerProyectos({ pagina, limite: POR_PAGINA, busqueda: busquedaDemorada, estado }),
    [pagina, busquedaDemorada, estado]
  );

  // ───── 3. ACCIONES ─────
  // Cada filtro nuevo arranca de la página 1.
  function alCambiarBusqueda(evento) {
    setBusqueda(evento.target.value);
    setPagina(1);
  }
  function alCambiarEstado(evento) {
    setEstado(evento.target.value);
    setPagina(1);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  let contenido;
  if (cargando) {
    contenido = <RowsSkeleton n={4} />;
  } else if (error) {
    contenido = <Alert kind="error" title="No pudimos cargar los proyectos">{mensajeDeError(error)}</Alert>;
  } else if (datos.resultados.length === 0) {
    contenido = (
      <div className={sh.empty}>
        <Text>No hay proyectos con esos filtros.</Text>
      </div>
    );
  } else {
    contenido = (
      <>
        <table className={sh.table}>
          <thead>
            <tr><th>Proyecto</th><th>Colectivo</th><th>Estado</th><th>Avance</th></tr>
          </thead>
          <tbody>
            {datos.resultados.map((proyecto) => (
              <tr key={proyecto.id}>
                <td data-l="Proyecto">
                  <Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link>
                </td>
                <td data-l="Colectivo">
                  <Link to={`/colectivos/${proyecto.colectivoId}`}>{proyecto.colectivo || 'Ver colectivo'}</Link>
                </td>
                <td data-l="Estado">
                  {proyecto.finalizado ? 'Finalizado' : <StatusBadge status={proyecto.estado} />}
                </td>
                <td data-l="Avance">{proyecto.avance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager page={pagina} pages={datos.totalPaginas} onChange={setPagina} />
      </>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Proyectos</Heading>

      {/* BLOQUE: filtros */}
      <div className={sh.search}>
        <Field label="Buscar" placeholder="Título o descripción" value={busqueda} onChange={alCambiarBusqueda} />
        <Field as="select" label="Estado" value={estado} onChange={alCambiarEstado}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </Field>
      </div>

      {contenido}
    </div>
  );
}
