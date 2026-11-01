/**
 * PANTALLA PostulacionesCol
 * Ruta: /panel/postulaciones   ·   Quién la ve: Colaboradora
 * Qué muestra: Mis postulaciones por estado, con acciones fuera de la tabla
 *   (Retirar / Ver proyecto).
 * Para modificarla: una columna nueva = un div más en .cells (y en la fila de encabezado).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: las postulaciones, la pestaña elegida y lo necesario para
 *      confirmar un «retiro».
 *   2. CÁLCULOS: filtra las postulaciones según la pestaña y decide qué se muestra
 *      dentro de las pestañas (cargando / vacío / tabla).
 *   3. ACCIONES: retirar una postulación.
 *   4. LO QUE SE DIBUJA: título, aviso, pestañas con su contenido y el diálogo de confirmación.
 *
 * Cómo se decide qué se ve dentro de las pestañas (en este orden):
 *   - mientras `cargando` es true: filas grises de relleno;
 *   - si ya cargó pero la lista filtrada está vacía: mensaje «No hay postulaciones acá»;
 *   - si no: la tabla. Cada fila muestra «Retirar» solo si está pendiente y «Ver proyecto»
 *     solo si fue aceptada; las rechazadas no tienen acciones.
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, StatusBadge, Text } from '../../atomos';
import { Alert, ConfirmDialog, RowsSkeleton, Tabs } from '../../moleculas';
import { POSTULACIONES_COL } from '../../datos'; // postulaciones de ejemplo
import { useLoading } from '../../hooks'; // simula la espera de datos
import { proyecto } from './auxiliares.js'; // busca un proyecto por id
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function PostulacionesCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // Pestaña activa: 'todas', 'pendientes', 'aceptadas' o 'rechazadas'.
  // Empieza en 'todas'; la cambia el componente Tabs al tocar una pestaña.
  // (ver docs/GLOSARIO.md → useState)
  const [pestanaActiva, setPestanaActiva] = useState('todas');

  // Lista de postulaciones. Empieza con las de ejemplo; se le saca una al retirarla.
  const [postulaciones, setPostulaciones] = useState(POSTULACIONES_COL);

  // Id de la postulación que se está por retirar (null = ninguna, el diálogo está cerrado).
  // Lo pone el botón «Retirar» y lo borra «Cancelar» o confirmar.
  const [idARetirar, setIdARetirar] = useState(null);

  // true muestra el aviso verde «Postulación retirada». Lo activa retirar y lo cierra la «x».
  const [avisoVisible, setAvisoVisible] = useState(false);

  // true mientras se «cargan» los datos (simulación; en producción vendría de la API).
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Pestañas que dibuja <Tabs>: `id` es el valor que se guarda en pestanaActiva
  // y `label` el texto visible.
  const pestanas = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'aceptadas', label: 'Aceptadas' },
    { id: 'rechazadas', label: 'Rechazadas' },
  ];

  // Qué estado de postulación corresponde a cada pestaña. null en «todas» = sin filtro.
  const estadoDeCadaPestana = {
    todas: null,
    pendientes: 'pendiente',
    aceptadas: 'aceptada',
    rechazadas: 'rechazada',
  };

  // Postulaciones de la pestaña activa. .filter se queda con las que cumplen la condición
  // (ver docs/GLOSARIO.md → Métodos de arrays). Si la pestaña no tiene estado (null)
  // pasan todas; si no, solo las que tienen ese estado.
  const estadoBuscado = estadoDeCadaPestana[pestanaActiva];
  const postulacionesVisibles = postulaciones.filter((postulacion) => {
    return !estadoBuscado || postulacion.estado === estadoBuscado;
  });

  // Contenido que va dentro de las pestañas. Se arma con if/else (en el mismo orden
  // que se explica en la cabecera del archivo) para no anidar ternarios dentro del JSX.
  let contenidoDeLaPestana;
  if (cargando) {
    contenidoDeLaPestana = <RowsSkeleton />;
  } else if (postulacionesVisibles.length === 0) {
    contenidoDeLaPestana = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay postulaciones acá</Heading>
        <Button as={Link} to="/proyectos">Ir a Proyectos</Button>
      </div>
    );
  } else {
    contenidoDeLaPestana = (
      <div className={s.rows} role="table" aria-label="Postulaciones">
        {/* Fila de encabezado; la última celda vacía deja el lugar de la columna de acciones */}
        <div className={`${s.r} ${s.h}`} role="row">
          <div className={s.cells}>
            <div role="columnheader">Proyecto</div>
            <div role="columnheader">Perfil</div>
            <div role="columnheader">Estado</div>
          </div>
          <div className={s.act} aria-hidden="true" />
        </div>

        {/* Una fila por postulación */}
        {postulacionesVisibles.map((postulacion) => (
          <div key={postulacion.id} className={s.r} role="row">
            <div className={s.cells}>
              <div className={s.hl} role="cell">{proyecto(postulacion.proyecto).titulo}</div>
              <div role="cell" data-l="Perfil">{postulacion.perfil}</div>
              <div role="cell" data-l="Estado"><StatusBadge status={postulacion.estado} /></div>
            </div>
            {/* Acciones fuera de la tabla: dependen del estado de la postulación */}
            <div className={s.act}>
              {/* Solo si está pendiente: se puede retirar (abre el diálogo de confirmación) */}
              {postulacion.estado === 'pendiente' && (
                <Button variant="danger" onClick={() => setIdARetirar(postulacion.id)}>
                  Retirar
                </Button>
              )}
              {/* Solo si fue aceptada: enlace al proyecto (`/proyectos/${…}` es una plantilla de
                 texto) */}
              {postulacion.estado === 'aceptada' && (
                <Button
                  as={Link}
                  to={`/proyectos/${postulacion.proyecto}`}
                  variant="secondary"
                >
                  Ver proyecto
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ───── 3. ACCIONES ─────

  // Se ejecuta al confirmar «Sí, retirar» en el diálogo: saca la postulación de la lista,
  // cierra el diálogo y muestra el aviso verde. (En producción: llamada a la API que la borra.)
  function retirarPostulacion() {
    // .filter devuelve una copia sin la postulación retirada (React exige copiar, no modificar)
    setPostulaciones((listaPrevia) => {
      return listaPrevia.filter((postulacion) => postulacion.id !== idARetirar);
    });
    setIdARetirar(null);
    setAvisoVisible(true);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Mis postulaciones</Heading>

      {/* Aparece solo después de retirar una postulación (avisoVisible = true) */}
      {avisoVisible && (
        <Alert kind="success" onClose={() => setAvisoVisible(false)}>
          Postulación retirada.
        </Alert>
      )}

      {/* BLOQUE: pestañas — filtran por estado; adentro va el contenido elegido arriba */}
      <Tabs tabs={pestanas} value={pestanaActiva} onChange={setPestanaActiva}>
        {contenidoDeLaPestana}
      </Tabs>

      {/* BLOQUE: diálogo de confirmación — abierto solo si hay una postulación elegida para
         retirar */}
      {/* `!!idARetirar` convierte el id (o null) en true/false */}
      <ConfirmDialog
        open={!!idARetirar}
        title="¿Retirar tu postulación?"
        danger
        confirmLabel="Sí, retirar"
        onCancel={() => setIdARetirar(null)}
        onConfirm={retirarPostulacion}
      >
        <Text>Vas a poder volver a postularte mientras el proyecto siga abierto.</Text>
      </ConfirmDialog>
    </div>
  );
}
