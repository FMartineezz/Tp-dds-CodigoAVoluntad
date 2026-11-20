/**
 * Campo de formulario accesible: etiqueta, ayuda y error ya conectados con aria.
 *
 * USO: as: 'input' (default) | 'textarea' | 'select'   label, hint, error, required, optional
 *      Cualquier otra prop (value, onChange, onBlur…) pasa directo al control.
 * SI LO CAMBIÁS O SACÁS: No quites label ni id: es lo que conecta el campo con lectores de pantalla.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un campo nuevo en un formulario es solo un <Field/> más dentro de la grilla .form (ver plantillas/disposicion.module.css).
 */
import { useId } from 'react';
import s from './Field.module.css';
import { cx } from '../../utilidades/cx.js';

export default function Field({ as: Control = 'input', label, hint, error, required, optional, className, children, ...rest }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={id} className={s.label}>
        {label}
        {required && <span className={s.req}> (obligatorio)</span>}
        {optional && <span className={s.req}> (opcional)</span>}
      </label>
      {hint && (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      )}
      <Control
        id={id}
        className={cx(s.control, error && s.invalid)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        {...rest}
      >
        {children}
      </Control>
      {error && (
        <p id={errId} className={s.error}>
          <span aria-hidden="true">✕ </span>
          {error}
        </p>
      )}
    </div>
  );
}
