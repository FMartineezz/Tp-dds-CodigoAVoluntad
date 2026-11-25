/**
 * PANTALLA ColaboradorasAdm
 * Ruta: /admin/colaboradoras   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Las personas colaboradoras, con búsqueda; desde acá se elimina una cuenta
 *   (con confirmación).
 * De dónde salen los datos: GET /colaboradoras?busqueda= (api/organizacion.js); eliminar
 *   hace DELETE /colaboradoras/:id (api/admin.js): sus datos públicos quedan anonimizados.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: búsqueda, página, la lista (del backend), a quién se quiere eliminar
 *      y los avisos.
 *      ESPERA Y ERRORES: aviso de error (mientras carga se ven filas grises).
 *   2. CÁLCULOS: no hay.
 *   3. ACCIONES: buscar y confirmar la eliminación.
 *   4. LO QUE SE DIBUJA: búsqueda, tabla, paginación y diálogo de confirmación.
 */
import { useState } from 'react';
import { Avatar, Button, Field, Heading, Tag, Text } from '../../atomos';
import { Alert, ConfirmDialog, Pager, RowsSkeleton } from '../../moleculas';
import { useDemorado, usePedido } from '../../hooks';
import { obtenerColaboradoras } from '../../api/organizacion.js';
import { eliminarColaboradora } from '../../api/admin.js';
import { mensajeDeError } from '../../api/errores.js';
import { fotoDe } from '../../datos/fotos.js';
import sh from '../../plantillas/disposicion.module.css';

const POR_PAGINA = 10;

export default function ColaboradorasAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  // Sumarle 1 vuelve a pedir la lista (después de eliminar una cuenta).
  const [version, setVersion] = useState(0);

  const busquedaDemorada = useDemorado(busqueda);
  const { cargando, datos, error } = usePedido(
    () => obtenerColaboradoras({ pagina, limite: POR_PAGINA, busqueda: busquedaDemorada }),
    [pagina, busquedaDemorada, version]
  );

  // Persona que se quiere eliminar (abre el diálogo), o null.
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);

  // ───── 3. ACCIONES ─────
  function alCambiarBusqueda(evento) {
    setBusqueda(evento.target.value);
    setPagina(1);
  }

  async function alConfirmarEliminacion() {
    setEliminando(true);
    setAviso('');
    setErrorAccion(null);
    try {
      await eliminarColaboradora(aEliminar.id);
      setAviso(`La cuenta de ${aEliminar.nombre} quedó eliminada.`);
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(e);
    } finally {
      setEliminando(false);
      setAEliminar(null);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  let contenido;
  if (cargando) {
    contenido = <RowsSkeleton n={4} />;
  } else if (error) {
    contenido = <Alert kind="error" title="No pudimos cargar las personas">{mensajeDeError(error)}</Alert>;
  } else if (datos.resultados.length === 0) {
    contenido = (
      <div className={sh.empty}>
        <Text>No hay personas con esa búsqueda.</Text>
      </div>
    );
  } else {
    contenido = (
      <>
        <table className={sh.table}>
          <thead>
            <tr><th>Persona</th><th>Alias</th><th>Habilidades</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {datos.resultados.map((persona) => (
              <tr key={persona.id}>
                <td data-l="Persona">
                  <span className={sh.person}>
                    <Avatar nombre={persona.nombre} size={36} foto={persona.foto || fotoDe(persona.id)} />
                    {persona.nombre}
                  </span>
                </td>
                <td data-l="Alias">{persona.alias}</td>
                <td data-l="Habilidades">
                  <span className={sh.tagsRow}>
                    {persona.habilidades.slice(0, 3).map((habilidad) => (
                      <Tag key={habilidad}>{habilidad}</Tag>
                    ))}
                    {persona.habilidades.length > 3 && <Tag>+{persona.habilidades.length - 3}</Tag>}
                  </span>
                </td>
                <td className={sh.actions}>
                  <Button variant="danger" onClick={() => setAEliminar(persona)}>
                    Eliminar cuenta
                  </Button>
                </td>
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
      <Heading level={1}>Personas colaboradoras</Heading>

      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error">{mensajeDeError(errorAccion)}</Alert>}

      <div className={sh.search}>
        <Field label="Buscar" placeholder="Nombre, apellido o alias" value={busqueda} onChange={alCambiarBusqueda} />
      </div>

      {contenido}

      <ConfirmDialog
        open={aEliminar !== null}
        title={`¿Eliminar la cuenta de ${aEliminar?.nombre}?`}
        confirmLabel="Sí, eliminar"
        danger
        loading={eliminando}
        onConfirm={alConfirmarEliminacion}
        onCancel={() => setAEliminar(null)}
      >
        Sus datos públicos se anonimizan y deja de poder usar la cuenta. Sus colaboraciones
        pasadas quedan en el historial de los proyectos. No se puede deshacer.
      </ConfirmDialog>
    </div>
  );
}
