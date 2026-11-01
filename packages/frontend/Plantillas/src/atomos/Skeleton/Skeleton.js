/**
 * Bloque gris animado que reserva lugar mientras carga algo.
 *
 * USO: <Skeleton height="2rem" />  |  <Skeleton lines={3} />
 * SI LO CAMBIÁS O SACÁS: Es decorativo (aria-hidden): avisá el estado de carga en el contenedor con aria-busy.
 */
import s from './Skeleton.module.css';

export default function Skeleton({ lines = 3, height }) {
  if (height) return <div className={s.block} style={{ height }} aria-hidden="true" />;
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={s.line} style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}
