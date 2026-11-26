/**
 * PANTALLA ColectivosAdm
 * Ruta: /admin/colectivos   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Los colectivos activos con cuántas denuncias tiene cada uno; desde acá se
 *   ven sus denuncias o se lo da de baja (con confirmación). El botón «Ver dados de baja»
 *   cambia a la lista de los que ya se dieron de baja (y «Ver activos» vuelve).
 * De dónde salen los datos: GET /colectivos (api/colectivos.js) y GET /admin/denuncias para
 *   contar; la baja hace DELETE /colectivos/:id (api/admin.js): deja de listarse y se
 *   borran sus contactos, pero su historia queda. Los dados de baja salen de
 *   GET /admin/colectivos/bajas.
 * Para modificarla: COLUMNA NUEVA: <th> en <thead> + <td data-l="…"> por fila.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · ColectivosDadosDeBaja (componente chico) → la lista de los dados de baja.
 *   1. DATOS Y ESTADO: qué lista se ve, la página de colectivos y las denuncias (del
 *      backend), la página elegida, cuál se quiere dar de baja y los avisos.
 *      ESPERA Y ERRORES: cargando o aviso de error.
 *   2. CÁLCULOS: denuncias por colectivo.
 *   3. ACCIONES: confirmar la baja.
 *   4. LO QUE SE DIBUJA: título con el botón «Ver dados de baja», avisos, tabla, paginación
 *      y diálogo de confirmación.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Heading, Text } from '../../atomos';
import { Alert, ConfirmDialog, Pager, RowsSkeleton } from '../../moleculas';
import { usePedido } from '../../hooks';
import { obtenerColectivos } from '../../api/colectivos.js';
import { darDeBajaColectivo, fechaCorta, obtenerColectivosDadosDeBaja, obtenerDenuncias } from '../../api/admin.js';
import { mensajeDeError } from '../../api/errores.js';
import { fotoDe } from '../../datos/fotos.js';
import { PantallaCargando, PantallaDeError } from './auxiliares.js';
import sh from '../../plantillas/disposicion.module.css';

const POR_PAGINA = 10;

async function cargarColectivos(pagina) {
  const [paginaDeColectivos, denuncias] = await Promise.all([
    obtenerColectivos({ pagina, limite: POR_PAGINA }),
    obtenerDenuncias(),
  ]);
  return { paginaDeColectivos, denuncias };
}

// ═════ COMPONENTE: lista de colectivos dados de baja ═════
function ColectivosDadosDeBaja({ alVolver }) {
  const { cargando, datos: colectivos, error } = usePedido(obtenerColectivosDadosDeBaja, []);

  let contenido;
  if (cargando) {
    contenido = <RowsSkeleton n={4} />;
  } else if (error) {
    contenido = <Alert kind="error" title="No pudimos cargar los dados de baja">{mensajeDeError(error)}</Alert>;
  } else if (colectivos.length === 0) {
    contenido = (
      <div className={sh.empty}>
        <Text>Todavía no se dio de baja ningún colectivo.</Text>
      </div>
    );
  } else {
    contenido = (
      <table className={sh.table}>
        <thead>
          <tr><th>Colectivo</th><th>Tipo</th><th>Ubicación</th><th>Dado de baja</th><th>Denuncias</th></tr>
        </thead>
        <tbody>
          {colectivos.map((colectivo) => (
            <tr key={colectivo.id}>
              {/* Sin enlace: su página pública ya no se muestra en el sitio */}
              <td data-l="Colectivo">
                <span className={sh.person}>
                  <Avatar nombre={colectivo.nombre} size={36} square foto={colectivo.foto || fotoDe(colectivo.id)} />
                  {colectivo.nombre}
                </span>
              </td>
              <td data-l="Tipo">{colectivo.tipo}</td>
              <td data-l="Ubicación">{colectivo.ubicacionTexto}</td>
              <td data-l="Dado de baja">{fechaCorta(colectivo.fechaDeBaja)}</td>
              <td data-l="Denuncias">
                <Link to={`/admin/denuncias?colectivo=${colectivo.id}`}>Ver sus denuncias</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <div className={`${sh.row} ${sh.spaceBetween}`}>
        <Heading level={1}>Colectivos dados de baja</Heading>
        <Button variant="secondary" onClick={alVolver}>Ver activos</Button>
      </div>
      {contenido}
    </div>
  );
}

// ═════ PANTALLA ═════
export default function ColectivosAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  // true = se ve la lista de los dados de baja en vez de la de activos.
  const [verBajas, setVerBajas] = useState(false);
  const [pagina, setPagina] = useState(1);
  // Sumarle 1 vuelve a pedir la lista (después de una baja).
  const [version, setVersion] = useState(0);
  const { cargando, datos, error } = usePedido(() => cargarColectivos(pagina), [pagina, version]);

  // Colectivo que se quiere dar de baja (abre el diálogo), o null.
  const [aDarDeBaja, setADarDeBaja] = useState(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);

  // ───── ESPERA Y ERRORES ─────
  if (verBajas) return <ColectivosDadosDeBaja alVolver={() => setVerBajas(false)} />;
  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaDeError titulo="No pudimos cargar los colectivos" error={error} />;

  const { paginaDeColectivos, denuncias } = datos;

  // ───── 2. CÁLCULOS ─────
  // Cuántas denuncias tiene un colectivo (todas, de cualquier estado).
  const denunciasDe = (colectivoId) =>
    denuncias.filter((denuncia) => String(denuncia.colectivoId) === String(colectivoId)).length;

  // ───── 3. ACCIONES ─────
  async function alConfirmarBaja() {
    setDandoDeBaja(true);
    setAviso('');
    setErrorAccion(null);
    try {
      await darDeBajaColectivo(aDarDeBaja.id);
      setAviso(`${aDarDeBaja.nombre} quedó dado de baja.`);
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(e);
    } finally {
      setDandoDeBaja(false);
      setADarDeBaja(null);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <div className={`${sh.row} ${sh.spaceBetween}`}>
        <Heading level={1}>Colectivos</Heading>
        <Button variant="secondary" onClick={() => setVerBajas(true)}>Ver dados de baja</Button>
      </div>

      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error">{mensajeDeError(errorAccion)}</Alert>}

      {paginaDeColectivos.resultados.length === 0 ? (
        <div className={sh.empty}>
          <Text>No hay colectivos activos.</Text>
        </div>
      ) : (
        <table className={sh.table}>
          <thead>
            <tr><th>Colectivo</th><th>Tipo</th><th>Ubicación</th><th>Denuncias</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {paginaDeColectivos.resultados.map((colectivo) => {
              const cantidadDeDenuncias = denunciasDe(colectivo.id);
              return (
                <tr key={colectivo.id}>
                  <td data-l="Colectivo">
                    <Link to={`/colectivos/${colectivo.id}`} className={sh.person}>
                      <Avatar nombre={colectivo.nombre} size={36} square foto={colectivo.foto || fotoDe(colectivo.id)} />
                      {colectivo.nombre}
                    </Link>
                  </td>
                  <td data-l="Tipo">{colectivo.tipo}</td>
                  <td data-l="Ubicación">{colectivo.ubicacionTexto}</td>
                  <td data-l="Denuncias">
                    {cantidadDeDenuncias > 0 ? (
                      <Link to={`/admin/denuncias?colectivo=${colectivo.id}`}>
                        {cantidadDeDenuncias} {cantidadDeDenuncias === 1 ? 'denuncia' : 'denuncias'}
                      </Link>
                    ) : (
                      'Ninguna'
                    )}
                  </td>
                  <td className={sh.actions}>
                    <Button variant="danger" onClick={() => setADarDeBaja(colectivo)}>
                      Dar de baja
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pager page={pagina} pages={paginaDeColectivos.totalPaginas} onChange={setPagina} />

      {/* Diálogo: la baja no se puede deshacer desde la plataforma */}
      <ConfirmDialog
        open={aDarDeBaja !== null}
        title={`¿Dar de baja a ${aDarDeBaja?.nombre}?`}
        confirmLabel="Sí, dar de baja"
        danger
        loading={dandoDeBaja}
        onConfirm={alConfirmarBaja}
        onCancel={() => setADarDeBaja(null)}
      >
        Deja de aparecer en la plataforma y se borran sus datos de contacto. Sus proyectos y
        colaboraciones pasadas quedan en el historial. No se puede deshacer.
      </ConfirmDialog>
    </div>
  );
}
