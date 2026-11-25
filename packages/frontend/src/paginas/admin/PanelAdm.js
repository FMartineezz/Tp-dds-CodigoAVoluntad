/**
 * PANTALLA PanelAdm
 * Ruta: /admin   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Lo que espera revisión (denuncias pendientes y reportes nuevos), las cifras
 *   de la plataforma y lo último que llegó.
 * De dónde salen los datos: GET /admin/denuncias, GET /admin/reportes (api/admin.js) y
 *   GET /estadisticas (api/estadisticas.js).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: denuncias, reportes y estadísticas (del backend).
 *      ESPERA Y ERRORES: cargando o aviso de error.
 *   2. CÁLCULOS: cuántas esperan revisión y las últimas de cada una.
 *   3. ACCIONES: no hay (todo son enlaces).
 *   4. LO QUE SE DIBUJA: cifras y dos listas cortas.
 */
import { Link } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { usePedido } from '../../hooks';
import { fechaCorta, obtenerDenuncias, obtenerReportes } from '../../api/admin.js';
import { obtenerEstadisticas } from '../../api/estadisticas.js';
import { TIPOS_DE_REPORTE } from '../../api/reportes.js';
import { EstadoTag, PantallaCargando, PantallaDeError } from './auxiliares.js';
import s from './Admin.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Cuántas filas se ven en cada lista de «lo último».
const ULTIMAS = 5;

// Pide todo a la vez. Las estadísticas tienen límite de pedidos: si fallan, el panel se
// muestra igual sin esas cifras (null).
async function cargarPanel() {
  const [denuncias, reportes, estadisticas] = await Promise.all([
    obtenerDenuncias(),
    obtenerReportes(),
    obtenerEstadisticas().catch(() => null),
  ]);
  return { denuncias, reportes, estadisticas };
}

export default function PanelAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  const { cargando, datos, error } = usePedido(() => cargarPanel(), []);

  // ───── ESPERA Y ERRORES ─────
  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaDeError titulo="No pudimos cargar el panel" error={error} />;

  const { denuncias, reportes, estadisticas } = datos;

  // ───── 2. CÁLCULOS ─────
  const denunciasPendientes = denuncias.filter((denuncia) => denuncia.estado === 'pendiente');
  const reportesNuevos = reportes.filter((reporte) => reporte.estado === 'nuevo');

  // Las cifras de arriba: [número, texto]. Las de la plataforma solo si llegaron.
  const cifras = [
    [denunciasPendientes.length, 'Denuncias pendientes'],
    [reportesNuevos.length, 'Problemas nuevos'],
  ];
  if (estadisticas) {
    cifras.push(
      [estadisticas.colectivos, 'Colectivos'],
      [estadisticas.proyectos, 'Proyectos'],
      [estadisticas.colaboradoras, 'Personas'],
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Panel de administración</Heading>

      {/* BLOQUE: cifras */}
      <div className={sh.stats}>
        {cifras.map(([numero, texto]) => (
          <div key={texto} className={sh.stat}>
            <b>{numero}</b>
            <span>{texto}</span>
          </div>
        ))}
      </div>

      <div className={sh.split}>
        {/* BLOQUE: denuncias que nadie miró todavía */}
        <section className={sh.column} aria-labelledby="denuncias">
          <Heading level={2} size="h3" id="denuncias">Denuncias por revisar</Heading>
          {denunciasPendientes.length === 0 ? (
            <Text variant="small">No hay denuncias pendientes.</Text>
          ) : (
            <ul className={s.lista}>
              {denunciasPendientes.slice(0, ULTIMAS).map((denuncia) => (
                <li key={denuncia.id}>
                  <Link to={`/admin/denuncias/${denuncia.id}`}>{denuncia.colectivo}</Link>
                  <span className={s.resumen}>{denuncia.descripcion}</span>
                  <span className={sh.muted}>{fechaCorta(denuncia.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
          <Button as={Link} to="/admin/denuncias" variant="secondary" iconRight="→">
            Ver todas las denuncias
          </Button>
        </section>

        {/* BLOQUE: reportes de problemas nuevos */}
        <section className={sh.column} aria-labelledby="problemas">
          <Heading level={2} size="h3" id="problemas">Problemas reportados</Heading>
          {reportesNuevos.length === 0 ? (
            <Text variant="small">No hay reportes nuevos.</Text>
          ) : (
            <ul className={s.lista}>
              {reportesNuevos.slice(0, ULTIMAS).map((reporte) => (
                <li key={reporte.id}>
                  <span>
                    <b>{TIPOS_DE_REPORTE[reporte.tipo]}</b> <EstadoTag estado={reporte.estado} />
                  </span>
                  <span className={s.resumen}>{reporte.descripcion}</span>
                  <span className={sh.muted}>{fechaCorta(reporte.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
          <Button as={Link} to="/admin/problemas" variant="secondary" iconRight="→">
            Ver todos los problemas
          </Button>
        </section>
      </div>
    </div>
  );
}
