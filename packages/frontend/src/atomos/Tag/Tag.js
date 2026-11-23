/**
 * Etiqueta chica (habilidades, causas, modalidad).
 *
 * USO: tone: sand (relleno arena) | blue | outline | yellow (SOLO avisos).
 * SI LO CAMBIÁS O SACÁS: El amarillo está reservado para advertencias; para etiquetas comunes usá sand.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Tono nuevo: clase en Tag.module.css + valor en la lista de tones de este comentario.
 */
import s from './Tag.module.css';
import { cx } from '../../utilidades/cx.js';

export default function Tag({ tone = 'outline', children }) {
  return <span className={cx(s.tag, s[tone])}>{children}</span>;
}
