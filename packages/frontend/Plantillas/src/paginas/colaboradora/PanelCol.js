/**
 * PANTALLA PanelCol
 * Ruta: /panel   ·   Quién la ve: Colaboradora
 * Qué muestra: Saludo, cifras, última actividad y proyectos sugeridos.
 * Para modificarla: las tarjetas de cifras son enlaces: una más = otro <Link className={sh.stat}>.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   2. CÁLCULOS: busca el proyecto que se sugiere en «Proyectos para vos».
 *   4. LO QUE SE DIBUJA: saludo, tres tarjetas de cifras (enlaces), la última
 *      actividad y el proyecto sugerido. Es una pantalla de demostración: los
 *      números y avisos están escritos a mano, no hay estado ni acciones.
 */

// ───── Imports ─────
import { Link } from 'react-router-dom';
import { Heading } from '../../atomos';
import { Alert } from '../../moleculas';
import { ProyectoCard } from '../../organismos'; // tarjeta que muestra un proyecto
import { proyecto } from './auxiliares.js'; // busca un proyecto por id
import s from './Colaboradora.module.css';
// sh = layout común (.page, .stats, .split…)
import sh from '../../plantillas/disposicion.module.css';

export default function PanelCol() {
  // ───── 2. CÁLCULOS ─────

  // Proyecto que se sugiere a la colaboradora: el que tiene id 50 en los datos de ejemplo.
  // (En producción lo calcularía el servidor según sus habilidades.)
  const proyectoSugerido = proyecto(50);

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Hola, Lucía</Heading>

      {/* BLOQUE: cifras — tres tarjetas que son enlaces a las pantallas de detalle */}
      {/* `${sh.stat} ${s.link}` es una plantilla de texto: junta dos clases CSS (ver
         docs/GLOSARIO.md → Plantillas de texto) */}
      <div className={sh.stats}>
        <Link to="/panel/postulaciones" className={`${sh.stat} ${s.link}`}>
          <b>2</b><span>postulaciones</span>
        </Link>
        <Link to="/panel/proyectos" className={`${sh.stat} ${s.link}`}>
          <b>1</b><span>proyecto activo</span>
        </Link>
        <Link to="/panel/mensajes" className={`${sh.stat} ${s.link}`}>
          <b>3</b><span>mensajes</span>
        </Link>
      </div>

      <div className={sh.split}>
        {/* BLOQUE: última actividad — avisos de lo que pasó (aria-labelledby apunta al título
           con id="ult") */}
        <section className={sh.col} aria-labelledby="ult">
          <Heading level={2} size="h3" id="ult">Última actividad</Heading>
          <Alert kind="success">
            Tu postulación a «App de turnos para el comedor» fue aceptada.
          </Alert>
          <Alert kind="info">Asamblea Barrial Norte te escribió un mensaje.</Alert>
          <Alert kind="info">Fundación Manos Unidas vio tu perfil.</Alert>
        </section>

        {/* BLOQUE: proyectos para vos — tarjeta del proyecto sugerido (título con id="sug") */}
        <section className={sh.col} aria-labelledby="sug">
          <Heading level={2} size="h3" id="sug">Proyectos para vos</Heading>
          <ProyectoCard p={proyectoSugerido} />
        </section>
      </div>
    </div>
  );
}
