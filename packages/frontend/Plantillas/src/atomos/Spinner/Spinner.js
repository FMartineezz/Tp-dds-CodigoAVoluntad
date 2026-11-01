/**
 * Indicador de carga circular.
 *
 * USO: <Spinner label="Cargando" />  |  inline para usarlo dentro de un botón.
 * SI LO CAMBIÁS O SACÁS: Button lo usa cuando loading={true}.
 */
import s from './Spinner.module.css';

export default function Spinner({ label = 'Cargando', inline = false }) {
  return (
    <span role="status" className={inline ? s.inline : s.block}>
      <span className={s.ring} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
