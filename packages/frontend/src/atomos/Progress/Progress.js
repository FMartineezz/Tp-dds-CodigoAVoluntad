/**
 * Barra de progreso (avance de un proyecto).
 *
 * USO: <Progress value={30} />  (0–100)
 * SI LO CAMBIÁS O SACÁS: Lleva role="img" y aria-label con el porcentaje.
 */
import s from './Progress.module.css';

export function Progress({ value, label = 'de avance' }) {
  return (
    <span className={s.bar} role="img" aria-label={`${value} por ciento ${label}`}>
      <span style={{ width: `${value}%` }} />
    </span>
  );
}
