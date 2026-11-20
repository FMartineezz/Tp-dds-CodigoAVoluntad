/**
 * Insignia de estado: color + ícono + TEXTO (nunca solo color).
 *
 * USO: status: abierto | cerrado | pendiente | aceptada | rechazada.
 *      Semántica: verde = positivo, ink = cerrado, amarillo = pendiente, rojo = negativo.
 * SI LO CAMBIÁS O SACÁS: Si sacás el texto o el ícono, el estado depende solo del color y deja de ser accesible (daltonismo).
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Estado nuevo: 1) sumalo al objeto ESTADOS de este archivo, 2) agregá su clase de color en StatusBadge.module.css.
 */
import s from './StatusBadge.module.css';
import { cx } from '../../utilidades/cx.js';

// Cada estado = color + forma + TEXTO. Nunca solo color (daltonismo).
const ESTADOS = {
  abierto: { glyph: '●', label: 'Abierto' },
  cerrado: { glyph: '■', label: 'Cerrado' },
  pendiente: { glyph: '◷', label: 'Pendiente' },
  aceptada: { glyph: '✓', label: 'Aceptada' },
  rechazada: { glyph: '✕', label: 'Rechazada' },
};

export default function StatusBadge({ status }) {
  const e = ESTADOS[status];
  if (!e) return null;
  return (
    <span className={cx(s.badge, s[status])}>
      <span aria-hidden="true">{e.glyph}</span>
      {e.label}
    </span>
  );
}
