/**
 * Selector de etiquetas: las elegidas se ven como chips y un desplegable agrega más.
 *
 * USO: label, value (array), options (array), onChange(array), addLabel, hint.
 * SI LO CAMBIÁS O SACÁS: Es lo que reemplaza a los campos de 'habilidades', 'causas', etc.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Opciones nuevas: agregalas al array que se pasa en options (ver datos/datos.js).
 */
import { useId } from 'react';
import { Icon } from '../../atomos';
import s from './TagPicker.module.css';

export function TagPicker({ label, value, options, onChange, addLabel = 'Agregar', hint }) {
  const id = useId();
  const libres = options.filter((o) => !value.includes(o));
  return (
    <div className={s.picker}>
      <span className={s.pl} id={id}>{label}</span>
      {hint && <span className={s.hint}>{hint}</span>}
      <div className={s.pbox} role="group" aria-labelledby={id}>
        {value.map((v) => (
          <button key={v} type="button" className={s.chipX} onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Quitar ${v}`}>
            {v} <Icon name="x" size={10} />
          </button>
        ))}
        {libres.length > 0 && (
          <select aria-label={`${addLabel} a ${label}`} value="" onChange={(e) => e.target.value && onChange([...value, e.target.value])} className={s.add}>
            <option value="">{addLabel}</option>
            {libres.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
