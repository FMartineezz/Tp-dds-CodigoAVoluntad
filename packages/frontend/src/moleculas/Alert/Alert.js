/**
 * Aviso en línea: éxito, error, información o advertencia.
 *
 * USO: kind: info | success | error | warning   title   onClose (muestra la X)
 * Un aviso de error, apenas aparece, scrollea la página hasta él si no se ve: si no, la
 * persona toca un botón, no ve nada y no sabe qué pasó.
 * SI LO CAMBIÁS O SACÁS: El amarillo (warning) es el único uso permitido de ese color. role="alert" para errores, "status" para el resto.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Tipo nuevo: agregá el ícono en ICONOS y la clase de color en Alert.module.css.
 */
import { useEffect, useRef } from 'react';
import s from './Alert.module.css';
import { cx } from '../../utilidades/cx.js';

const ICONOS = { info: 'ℹ', success: '✓', error: '✕', warning: '!' };

// ¿Se ve entero en la pantalla?
function seVe(elemento) {
  const { top, bottom } = elemento.getBoundingClientRect();
  return top >= 0 && bottom <= window.innerHeight;
}

export default function Alert({ kind = 'info', title, onClose, children }) {
  const aviso = useRef(null);

  // Al aparecer un error que quedó fuera de la pantalla (casi siempre arriba de todo, porque
  // los avisos van al principio), la página sube hasta él.
  useEffect(() => {
    if (kind !== 'error' || !aviso.current || seVe(aviso.current)) return;
    const sinAnimacion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    aviso.current.scrollIntoView({ behavior: sinAnimacion ? 'auto' : 'smooth', block: 'start' });
  }, [kind]);

  return (
    <div ref={aviso} className={cx(s.alert, s[kind])} role={kind === 'error' ? 'alert' : 'status'}>
      <span className={s.icon} aria-hidden="true">{ICONOS[kind]}</span>
      <div className={s.body}>
        {title && <strong className={s.title}>{title}</strong>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button type="button" className={s.close} onClick={onClose} aria-label="Cerrar aviso">
          ✕
        </button>
      )}
    </div>
  );
}
