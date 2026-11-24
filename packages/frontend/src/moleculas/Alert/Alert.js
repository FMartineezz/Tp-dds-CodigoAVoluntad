/**
 * Aviso en línea: éxito, error, información o advertencia.
 *
 * USO: kind: info | success | error | warning   title   onClose (muestra la X)
 * SI LO CAMBIÁS O SACÁS: El amarillo (warning) es el único uso permitido de ese color. role="alert" para errores, "status" para el resto.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Tipo nuevo: agregá el ícono en ICONOS y la clase de color en Alert.module.css.
 */
import s from './Alert.module.css';
import { cx } from '../../utilidades/cx.js';

const ICONOS = { info: 'ℹ', success: '✓', error: '✕', warning: '!' };

export default function Alert({ kind = 'info', title, onClose, children }) {
  return (
    <div className={cx(s.alert, s[kind])} role={kind === 'error' ? 'alert' : 'status'}>
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
