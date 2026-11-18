/**
 * PANTALLA PanelCol
 * Ruta: /panel   ·   Quién la ve: Colaboradora
 * Qué muestra: Saludo, cifras, últimas novedades y proyectos sugeridos.
 * De dónde salen los datos: del backend, con obtenerPanel (api/colaboradora.js), que junta
 *   el perfil, las postulaciones, las colaboraciones, los mensajes, las notificaciones y los
 *   proyectos acordes a sus habilidades.
 * Para modificarla: las tarjetas de cifras son enlaces: una más = otro <Link className={sh.stat}>.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: quién tiene la sesión y el pedido del panel al backend.
 *      ESPERA Y ERRORES: filas grises mientras llega; un aviso si falla.
 *   4. LO QUE SE DIBUJA: saludo, tres tarjetas de cifras (enlaces), las últimas novedades
 *      y los proyectos sugeridos. No hay acciones: es una pantalla para mirar.
 */

// ───── Imports ─────
import { Link } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { Alert, RowsSkeleton } from '../../moleculas';
import { ProyectoCard } from '../../organismos'; // tarjeta que muestra un proyecto
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerPanel } from '../../api/colaboradora.js';
import s from './Colaboradora.module.css';
// sh = layout común (.page, .stats, .split…)
import sh from '../../plantillas/disposicion.module.css';

export default function PanelCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // `id` es el _id de la colaboradora con la sesión (ver contexto/Auth.js).
  const { id } = useAuth();
  // Pide todo el panel junto. Se vuelve a pedir si cambia la sesión (por eso [id]).
  // `datos: panel` = «lo que viene en `datos` guardalo con el nombre `panel`».
  const { cargando, datos: panel, error } = usePedido(() => obtenerPanel(id), [id]);

  // ───── ESPERA Y ERRORES ─────
  // Caso 1: todavía no llegó la respuesta → filas grises de relleno.
  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={4} />
      </div>
    );
  }

  // Caso 2: algo falló (backend apagado, error 500…) → aviso.
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar tu panel">
          Probá de nuevo en un rato.
        </Alert>
      </div>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Hola, {panel.nombre}</Heading>

      {/* BLOQUE: cifras — tres tarjetas que son enlaces a las pantallas de detalle */}
      {/* `${sh.stat} ${s.link}` es una plantilla de texto: junta dos clases CSS (ver
         docs/GLOSARIO.md → Plantillas de texto) */}
      <div className={sh.stats}>
        <Link to="/panel/postulaciones" className={`${sh.stat} ${s.link}`}>
          <b>{panel.pendientes}</b><span>postulaciones pendientes</span>
        </Link>
        <Link to="/panel/proyectos" className={`${sh.stat} ${s.link}`}>
          {/* `=== 1 ? … : …` elige singular o plural */}
          <b>{panel.proyectosActivos}</b>
          <span>{panel.proyectosActivos === 1 ? 'proyecto activo' : 'proyectos activos'}</span>
        </Link>
        <Link to="/panel/mensajes" className={`${sh.stat} ${s.link}`}>
          <b>{panel.mensajes}</b><span>mensajes</span>
        </Link>
      </div>

      <div className={sh.split}>
        {/* BLOQUE: novedades — las últimas notificaciones del sistema (aria-labelledby apunta
           al título con id="ult") */}
        <section className={sh.col} aria-labelledby="ult">
          <Heading level={2} size="h3" id="ult">Última actividad</Heading>
          {panel.novedades.length === 0 && (
            <Text variant="small">Todavía no tenés novedades.</Text>
          )}
          {panel.novedades.map((novedad) => (
            <Alert key={novedad.id} kind="info">
              {novedad.texto} <small>({novedad.cuando})</small>
            </Alert>
          ))}
        </section>

        {/* BLOQUE: proyectos para vos — los que buscan alguna de sus habilidades (título con
           id="sug") */}
        <section className={sh.col} aria-labelledby="sug">
          <Heading level={2} size="h3" id="sug">Proyectos para vos</Heading>
          {panel.sugeridos.length === 0 && (
            <>
              <Text variant="small">
                No hay proyectos abiertos que busquen tus habilidades. Sumá habilidades en tu perfil.
              </Text>
              <Button as={Link} to="/panel/perfil" variant="secondary">Editar mi perfil</Button>
            </>
          )}
          {panel.sugeridos.map((proyecto) => (
            <ProyectoCard key={proyecto.id} p={proyecto} />
          ))}
        </section>
      </div>
    </div>
  );
}
