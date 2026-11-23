/**
 * Íconos de línea (SVG). El nombre elige el dibujo.
 *
 * USO: <Icon name="chevron-der" size={14} />
 * SI LO CAMBIÁS O SACÁS: Es un set provisorio de ~20 íconos hechos a mano. Cuando elijan una biblioteca (Lucide, Phosphor…) reemplazá SOLO este archivo.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Ícono nuevo: agregá una entrada en el objeto PATHS (trazo dentro de un viewBox 12×12) y usalo por su nombre.
 */
import s from './Icon.module.css';

const PATHS = {
  check: 'M1 5.2l3.4 3.3L11 1.5',
  'chevron-der': 'M3 1l5 5-5 5',
  'chevron-izq': 'M8 1L3 6l5 5',
  'chevron-abajo': 'M1 3l5 5 5-5',
  mas: 'M6 1v10M1 6h10',
  candado: 'M2.5 5.5h7v5h-7zM4 5.5V3.5a2 2 0 014 0v2',
  x: 'M2 2l8 8M10 2l-8 8',
  'flecha-izq': 'M11 6H1m4-4L1 6l4 4',
  panel: 'M1 6l5-4.5L11 6v5H7V8H5v3H1z',
  proyectos: 'M1 3h4l1 1.5h5V10H1z',
  postulaciones: 'M2 1h8v10H2zM4 4h4M4 6.5h4M4 9h2',
  mensajes: 'M1 2h10v6H6l-3 2.5V8H1z',
  colaboradoras: 'M6 5.5a2 2 0 100-4 2 2 0 000 4zM2 11c0-2.5 1.8-4 4-4s4 1.5 4 4',
  campana: 'M3 9V5.5a3 3 0 016 0V9l1 1H2zM5 11h2',
  usuario: 'M6 5.5a2 2 0 100-4 2 2 0 000 4zM2 11c0-2.5 1.8-4 4-4s4 1.5 4 4',
  estrella: 'M6 1l1.4 3.2 3.4.3-2.6 2.2.8 3.3L6 8.2 3 10l.8-3.3L1.2 4.5l3.4-.3z',
};

export function Icon({ name, size = 14 }) {
  return (
    <svg className={s.icon} width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
