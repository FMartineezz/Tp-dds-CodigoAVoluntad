/**
 * PANTALLA ProblemasAdm
 * Ruta: /admin/problemas   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Los reportes de problemas que manda la gente desde «Reportar un problema»
 *   (pie del sitio), en pestañas por estado, con botones para moverlos de estado.
 * De dónde salen los datos: GET /admin/reportes; los botones hacen
 *   PATCH /admin/reportes/:id/estado (api/admin.js).
 * Para modificarla: COLUMNA NUEVA: <th> en <thead> + <td data-l="…"> por fila.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: los reportes (del backend), la pestaña, cuál se está guardando y el
 *      aviso de error.
 *      ESPERA Y ERRORES: cargando o aviso de error.
 *   2. CÁLCULOS: contadores por estado y la lista de la pestaña.
 *   3. ACCIONES: pasar un reporte a otro estado.
 *   4. LO QUE SE DIBUJA: pestañas y tabla.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { Alert, Tabs } from '../../moleculas';
import { usePedido } from '../../hooks';
import {
  ESTADOS_DE_REPORTE,
  cambiarEstadoReporte,
  fechaCorta,
  obtenerReportes,
} from '../../api/admin.js';
import { TIPOS_DE_REPORTE } from '../../api/reportes.js';
import { mensajeDeError } from '../../api/errores.js';
import { PantallaCargando, PantallaDeError } from './auxiliares.js';
import s from './Admin.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Qué botón se ofrece en cada pestaña: estado actual → [estado al que pasa, texto].
const SIGUIENTE = {
  nuevo: [['en_revision', 'Lo estoy mirando'], ['resuelto', 'Resuelto']],
  en_revision: [['resuelto', 'Resuelto']],
  resuelto: [['nuevo', 'Reabrir']],
};

export default function ProblemasAdm() {
  // ───── 1. DATOS Y ESTADO ─────

  // Sumarle 1 vuelve a pedir la lista (después de mover un reporte).
  const [version, setVersion] = useState(0);
  const { cargando, datos: reportes, error } = usePedido(() => obtenerReportes(), [version]);

  const [pestana, setPestana] = useState('nuevo');

  // Id del reporte que se está guardando (sus botones muestran espera), o null.
  const [guardandoId, setGuardandoId] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  // ───── ESPERA Y ERRORES ─────
  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaDeError titulo="No pudimos cargar los reportes" error={error} />;

  // ───── 2. CÁLCULOS ─────
  const pestanas = Object.entries(ESTADOS_DE_REPORTE).map(([estado, texto]) => ({
    id: estado,
    label: `${texto} (${reportes.filter((reporte) => reporte.estado === estado).length})`,
  }));
  const reportesDeLaPestana = reportes.filter((reporte) => reporte.estado === pestana);

  // ───── 3. ACCIONES ─────
  async function alMover(reporte, estado) {
    setGuardandoId(reporte.id);
    setErrorAccion(null);
    try {
      await cambiarEstadoReporte(reporte.id, estado);
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(e);
    } finally {
      setGuardandoId(null);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Problemas reportados</Heading>

      {errorAccion && <Alert kind="error">{mensajeDeError(errorAccion)}</Alert>}

      <Tabs tabs={pestanas} value={pestana} onChange={setPestana}>
        {reportesDeLaPestana.length === 0 ? (
          <div className={sh.empty}>
            <Text>No hay reportes en esta lista.</Text>
          </div>
        ) : (
          <table className={sh.table}>
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Qué pasó</th><th>Pantalla</th><th>Correo</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {reportesDeLaPestana.map((reporte) => (
                <tr key={reporte.id}>
                  <td data-l="Fecha">{fechaCorta(reporte.fecha)}</td>
                  <td data-l="Tipo">{TIPOS_DE_REPORTE[reporte.tipo] ?? reporte.tipo}</td>
                  <td data-l="Qué pasó" className={s.celdaTexto}>{reporte.descripcion}</td>
                  <td data-l="Pantalla">
                    {reporte.pantalla ? <Link to={reporte.pantalla}>{reporte.pantalla}</Link> : '—'}
                  </td>
                  <td data-l="Correo">
                    {reporte.correo ? <a href={`mailto:${reporte.correo}`}>{reporte.correo}</a> : '—'}
                  </td>
                  <td className={sh.actions}>
                    <div className={sh.row}>
                      {SIGUIENTE[reporte.estado].map(([estado, texto]) => (
                        <Button
                          key={estado}
                          variant={estado === 'resuelto' ? 'success' : 'secondary'}
                          loading={guardandoId === reporte.id}
                          disabled={guardandoId !== null}
                          onClick={() => alMover(reporte, estado)}
                        >
                          {texto}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tabs>
    </div>
  );
}
