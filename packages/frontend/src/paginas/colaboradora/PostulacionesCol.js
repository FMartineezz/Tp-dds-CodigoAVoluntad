/**
 * PANTALLA PostulacionesCol
 * Ruta: /panel/postulaciones   ·   Quién la ve: Colaboradora
 * Qué muestra: Mis postulaciones por estado (pendiente / aceptada / rechazada).
 * De dónde salen los datos: del backend, GET /colaboradoras/:id/postulaciones
 *   (obtenerPostulaciones en api/colaboradora.js).
 * Para modificarla: una columna nueva = un div más en .celdas (y en la fila de encabezado).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: quién tiene la sesión, el pedido al backend y la pestaña elegida.
 *   2. CÁLCULOS: filtra las postulaciones según la pestaña y decide qué se muestra
 *      dentro de las pestañas (cargando / error / vacío / tabla).
 *   4. LO QUE SE DIBUJA: título y pestañas con su contenido.
 *
 * Cómo se decide qué se ve dentro de las pestañas (en este orden):
 *   - mientras `cargando` es true: filas grises de relleno;
 *   - si el pedido falló: aviso de error;
 *   - si ya cargó pero la lista filtrada está vacía: mensaje «No hay postulaciones acá»;
 *   - si no: la tabla. Las aceptadas llevan a «Mis proyectos».
 *
 * PENDIENTE (backend): no existe DELETE /postulaciones/:id, así que la colaboradora todavía
 *   no puede retirar una postulación pendiente (antes había un botón «Retirar» simulado).
 * PENDIENTE (front): el backend ya manda `proyectoId` (y el adaptador lo expone), así que el
 *   título del proyecto se podría enlazar a /proyectos/:id; hoy se muestra como texto.
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, StatusBadge, Tag } from '../../atomos';
import { Alert, RowsSkeleton, Tabs } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerPostulaciones } from '../../api/colaboradora.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Pestañas que dibuja <Tabs>: `id` es el valor que se guarda en pestanaActiva
// y `label` el texto visible. Están afuera del componente porque nunca cambian.
const PESTANAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'aceptadas', label: 'Aceptadas' },
  { id: 'rechazadas', label: 'Rechazadas' },
];

// Qué estado de postulación corresponde a cada pestaña. null en «todas» = sin filtro.
const ESTADO_DE_CADA_PESTANA = {
  todas: null,
  pendientes: 'pendiente',
  aceptadas: 'aceptada',
  rechazadas: 'rechazada',
};

export default function PostulacionesCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // `id` es el _id de la colaboradora con la sesión (ver contexto/Auth.js).
  const { id } = useAuth();

  // Pide las postulaciones al backend. Se vuelve a pedir si cambia la sesión (por eso [id]).
  // `datos: postulaciones` = «lo que viene en `datos` guardalo con el nombre `postulaciones`».
  const { cargando, datos: postulaciones, error } = usePedido(() => obtenerPostulaciones(id), [id]);

  // Pestaña activa: 'todas', 'pendientes', 'aceptadas' o 'rechazadas'.
  // Empieza en 'todas'; la cambia el componente Tabs al tocar una pestaña.
  // (ver docs/GLOSARIO.md → useState)
  const [pestanaActiva, setPestanaActiva] = useState('todas');

  // ───── 2. CÁLCULOS ─────

  // Postulaciones de la pestaña activa. .filter se queda con las que cumplen la condición
  // (ver docs/GLOSARIO.md → Métodos de arrays). Si la pestaña no tiene estado (null)
  // pasan todas; si no, solo las que tienen ese estado. Mientras carga, `postulaciones` es
  // null: `?? []` usa una lista vacía para no romper.
  const estadoBuscado = ESTADO_DE_CADA_PESTANA[pestanaActiva];
  const postulacionesVisibles = (postulaciones ?? []).filter((postulacion) => {
    return !estadoBuscado || postulacion.estado === estadoBuscado;
  });

  // Contenido que va dentro de las pestañas. Se arma con if/else (en el mismo orden
  // que se explica en la cabecera del archivo) para no anidar ternarios dentro del JSX.
  let contenidoDeLaPestana;
  if (cargando) {
    contenidoDeLaPestana = <RowsSkeleton />;
  } else if (error) {
    contenidoDeLaPestana = (
      <Alert kind="error" title="No pudimos cargar tus postulaciones">
        {mensajeDeError(error)}
      </Alert>
    );
  } else if (postulacionesVisibles.length === 0) {
    contenidoDeLaPestana = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay postulaciones acá</Heading>
        <Button as={Link} to="/proyectos">Ir a Proyectos</Button>
      </div>
    );
  } else {
    contenidoDeLaPestana = (
      <div className={s.filas} role="table" aria-label="Postulaciones">
        {/* Fila de encabezado; la última celda vacía deja el lugar de la columna de acciones */}
        <div className={`${s.fila} ${s.encabezado}`} role="row">
          <div className={s.celdas}>
            <div role="columnheader">Proyecto</div>
            <div role="columnheader">Perfil</div>
            <div role="columnheader">Estado</div>
          </div>
          <div className={s.acciones} aria-hidden="true" />
        </div>

        {/* Una fila por postulación */}
        {postulacionesVisibles.map((postulacion) => (
          <div key={postulacion.id} className={s.fila} role="row">
            <div className={s.celdas}>
              <div className={s.destacada} role="cell">{postulacion.proyecto}</div>
              <div role="cell" data-l="Perfil">
                {postulacion.perfil}
                {/* Si se postuló en forma anónima, se marca con una etiqueta */}
                {postulacion.anonima && <> <Tag tone="outline">Anónima</Tag></>}
              </div>
              <div role="cell" data-l="Estado"><StatusBadge status={postulacion.estado} /></div>
            </div>
            {/* Acciones fuera de la tabla: solo las aceptadas tienen una (ir a Mis proyectos) */}
            <div className={s.acciones}>
              {postulacion.estado === 'aceptada' && (
                <Button as={Link} to="/panel/proyectos" variant="secondary">
                  Ver en Mis proyectos
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Mis postulaciones</Heading>

      {/* BLOQUE: pestañas — filtran por estado; adentro va el contenido elegido arriba */}
      <Tabs tabs={PESTANAS} value={pestanaActiva} onChange={setPestanaActiva}>
        {contenidoDeLaPestana}
      </Tabs>
    </div>
  );
}
